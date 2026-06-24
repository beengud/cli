import type { Config } from "../../lib/config";
import {
  GetMonitorV2Document,
  type GetMonitorV2Query,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlMonitor = GetMonitorV2Query["monitorV2"];

export async function getMonitor(
  config: Config,
  id: string,
): Promise<GqlMonitor> {
  const response = await executeGraphQL(config, GetMonitorV2Document, { id });
  return response.data.monitorV2;
}
