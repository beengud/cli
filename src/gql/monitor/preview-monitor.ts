import type { Config } from "../../lib/config";
import {
  PreviewMonitorV2Document,
  type PreviewMonitorV2Query,
  type MonitorV2Input,
  type QueryParams,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlMonitorPreview = PreviewMonitorV2Query["previewMonitorV2"];

export async function previewMonitor(
  config: Config,
  input: MonitorV2Input,
  params: QueryParams,
  workspaceId?: string,
): Promise<GqlMonitorPreview> {
  const response = await executeGraphQL(config, PreviewMonitorV2Document, {
    workspaceId,
    input,
    params,
  });
  return response.data.previewMonitorV2;
}
