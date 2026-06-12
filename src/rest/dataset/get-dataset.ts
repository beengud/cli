import type { Config } from "../../lib/config";
import { ObserveRestSDK } from "../client";

export async function getDataset({
  config,
  id,
}: {
  config: Config;
  id: string;
}) {
  const sdk = new ObserveRestSDK(config);
  return sdk.datasetApi.getDataset({ id, expand: true });
}
