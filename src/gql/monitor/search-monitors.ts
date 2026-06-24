import type { Config } from "../../lib/config";
import {
  SearchMonitorV2Document,
  type SearchMonitorV2Query,
  type SearchMonitorV2QueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlMonitorSummary =
  SearchMonitorV2Query["searchMonitorV2"]["results"][number];

export async function searchMonitors(
  config: Config,
  variables?: SearchMonitorV2QueryVariables,
): Promise<GqlMonitorSummary[]> {
  const response = await executeGraphQL(
    config,
    SearchMonitorV2Document,
    variables ?? {},
  );
  return response.data.searchMonitorV2.results;
}
