/**
 * Device code flow for headless/remote authentication
 *
 * Displays a verification URL and code for the user to enter
 * on another device, then polls the server until authentication
 * is complete.
 */

import { observeApiHeaders } from "../user-agent";

export interface DeviceCodeLoginResult {
  success: boolean;
  customerId?: string;
  token?: string;
  domain?: string;
  apiUrl?: string;
  tokenId?: string;
  error?: string;
}

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface DeviceCodePollResponse {
  status: "pending" | "authorized" | "expired" | "denied";
  customer_id?: string;
  token?: string;
  domain?: string;
  apiUrl?: string;
  token_id?: string;
  error?: string;
}

interface ApiResponse<T> {
  code: number;
  status: string;
  message: string;
  data: T;
}

/**
 * Initiate the device code flow
 */
async function initiateDeviceCode(
  authServerUrl: string,
): Promise<DeviceCodeResponse> {
  const response = await fetch(authServerUrl, {
    method: "POST",
    headers: observeApiHeaders({
      "Content-Type": "application/json",
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to initiate device code flow: ${response.status} ${response.statusText}`,
    );
  }

  const json = (await response.json()) as ApiResponse<DeviceCodeResponse>;

  if (json.status !== "ok") {
    throw new Error(json.message || "Failed to initiate device code flow");
  }

  return json.data;
}

/**
 * Poll the server to check if the user has completed authentication
 */
async function pollDeviceCode({
  pollUrl,
  deviceCode,
}: {
  pollUrl: string;
  deviceCode: string;
}): Promise<DeviceCodePollResponse> {
  const response = await fetch(pollUrl, {
    method: "POST",
    headers: observeApiHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ device_code: deviceCode }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to poll device code: ${response.status} ${response.statusText}`,
    );
  }

  const json = (await response.json()) as ApiResponse<DeviceCodePollResponse>;

  return json.data;
}

/**
 * Perform device code login flow
 */
export async function performDeviceCodeLogin({
  deviceLoginUrl,
  pollUrl,
  verificationUrl,
  onCodeReceived,
}: {
  deviceLoginUrl: string;
  pollUrl: string;
  verificationUrl: string;
  onCodeReceived: (userCode: string, verificationUri: string) => void;
}): Promise<DeviceCodeLoginResult> {
  try {
    // Step 1: Initiate the device code flow
    const deviceCodeData = await initiateDeviceCode(deviceLoginUrl);

    // Step 2: Display the code to the user
    onCodeReceived(deviceCodeData.user_code, verificationUrl);

    // Step 3: Poll for completion
    const pollInterval = deviceCodeData.interval * 1000; // Convert to milliseconds
    const expiresAt = Date.now() + deviceCodeData.expires_in * 1000;

    while (Date.now() < expiresAt) {
      // Wait for the polling interval
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      // Poll the server
      const pollResult = await pollDeviceCode({
        pollUrl,
        deviceCode: deviceCodeData.device_code,
      });

      if (pollResult.status === "authorized") {
        return {
          success: true,
          customerId: pollResult.customer_id,
          token: pollResult.token,
          domain: pollResult.domain,
          apiUrl: pollResult.apiUrl,
          tokenId: pollResult.token_id,
        };
      }

      if (pollResult.status === "denied") {
        return {
          success: false,
          error: "Authentication was denied",
        };
      }

      if (pollResult.status === "expired") {
        return {
          success: false,
          error: "Device code expired",
        };
      }

      // Status is "pending", continue polling
    }

    // Timeout
    return {
      success: false,
      error: "Authentication timed out",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
