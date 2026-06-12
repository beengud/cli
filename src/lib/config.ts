import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { CONFIG_DIR_MODE, CONFIG_DIR_NAME, CONFIG_FILES } from "./constants";

/**
 * Schema for Observe CLI configuration
 */
export const ConfigSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  domain: z.string().min(1, "Domain is required"),
  token: z.string().min(1, "Token is required"),
  tokenId: z.string().optional(),
  apiUrl: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Get the configuration directory path
 */
export function getConfigDir(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, CONFIG_DIR_NAME);
}

/**
 * Ensure the config directory exists with restricted permissions (0o700).
 * Creates the directory if missing, or tightens permissions if it already exists.
 */
export function ensureConfigDir(): string {
  const configDir = getConfigDir();

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true, mode: CONFIG_DIR_MODE });
  } else {
    fs.chmodSync(configDir, CONFIG_DIR_MODE);
  }

  return configDir;
}

/**
 * Get the configuration file path
 */
export function getConfigPath(): string {
  return path.join(getConfigDir(), CONFIG_FILES.config.name);
}

/**
 * Check if configuration exists
 */
export function configExists(): boolean {
  return fs.existsSync(getConfigPath());
}

/**
 * Load configuration from file
 * @throws Error if config doesn't exist or is invalid
 */
export function loadConfig(): Config {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Configuration not found. Run 'observe auth login' to authenticate.`,
    );
  }

  const raw = fs.readFileSync(configPath, "utf-8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse configuration file as JSON`);
  }

  const result = ConfigSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(
      `Invalid configuration: ${result.error.issues.map((i) => i.message).join(", ")}`,
    );
  }

  return result.data;
}

/**
 * Save configuration to file
 */
export function saveConfig(config: Config): void {
  ensureConfigDir();
  const configPath = getConfigPath();

  // Validate config before saving
  const result = ConfigSchema.safeParse(config);
  if (!result.success) {
    throw new Error(
      `Invalid configuration: ${result.error.issues.map((i) => i.message).join(", ")}`,
    );
  }

  // Write config file with restricted permissions
  fs.writeFileSync(configPath, JSON.stringify(result.data, null, 2), {
    mode: CONFIG_FILES.config.mode,
  });
}

/**
 * Delete configuration file
 * @returns true if config was deleted, false if it didn't exist
 */
export function deleteConfig(): boolean {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    return false;
  }

  fs.unlinkSync(configPath);
  return true;
}

/**
 * Get the base URL for the Observe API
 */
export function getApiBaseUrl(config: Config): string {
  // apiUrl is the full API endpoint (e.g., "https://123456789012.observe-sandbox.com/v1/meta")
  // Strip the /v1/meta suffix to get the base URL
  if (config.apiUrl) {
    return config.apiUrl.replace(/\/v1\/meta$/, "");
  }

  return `https://${config.customerId}.${config.domain}`;
}
