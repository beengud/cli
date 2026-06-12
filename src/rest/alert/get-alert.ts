import type { Config } from "../../lib/config";
import type { AlertResource } from "../generated";
import { ObserveRestSDK } from "../client";

export async function getAlert({
  config,
  alertId,
}: {
  config: Config;
  alertId: string;
}): Promise<AlertResource | null> {
  const sdk = new ObserveRestSDK(config);
  const response = await sdk.alertApi.listAlerts({
    filter: `id == "${alertId}"`,
    limit: 1,
    expand: true,
  });
  return response.alerts[0] ?? null;
}
