import type { Config } from "../../lib/config";
import type { AlertApiListAlertsRequest } from "../generated";
import { ObserveRestSDK } from "../client";

export async function listAlerts({
  config,
  ...params
}: { config: Config } & Omit<AlertApiListAlertsRequest, "expand">) {
  const sdk = new ObserveRestSDK(config);
  const response = await sdk.alertApi.listAlerts({
    ...params,
    expand: true,
  });
  return response;
}
