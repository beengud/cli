import type { Config } from "../../lib/config";
import {
  EvaluateMonitorV2SourceDocument,
  type EvaluateMonitorV2SourceQuery,
  type MonitorV2Input,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlSourceEvaluation =
  EvaluateMonitorV2SourceQuery["evaluateMonitorV2Source"];

export async function evaluateMonitorSource(
  config: Config,
  input: MonitorV2Input,
): Promise<GqlSourceEvaluation> {
  const response = await executeGraphQL(
    config,
    EvaluateMonitorV2SourceDocument,
    { input },
  );
  return response.data.evaluateMonitorV2Source;
}
