import type { Config } from "../../lib/config";
import {
  SearchMonitorV2AlarmsDocument,
  type SearchMonitorV2AlarmsQuery,
  type SearchMonitorV2AlarmsQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlMonitorAlarm =
  SearchMonitorV2AlarmsQuery["searchMonitorV2Alarms"]["results"][number];

export async function searchMonitorAlarms(
  config: Config,
  variables?: SearchMonitorV2AlarmsQueryVariables,
): Promise<GqlMonitorAlarm[]> {
  const response = await executeGraphQL(
    config,
    SearchMonitorV2AlarmsDocument,
    variables ?? {},
  );
  return response.data.searchMonitorV2Alarms.results;
}
