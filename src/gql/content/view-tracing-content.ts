import type { Config } from "../../lib/config";
import {
  GetTracingContentDocument,
  type GetTracingContentQuery,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlTracingContent = GetTracingContentQuery["tracingContent"];

export async function getTracingContent(
  config: Config,
): Promise<GqlTracingContent> {
  const response = await executeGraphQL(config, GetTracingContentDocument);
  return response.data.tracingContent;
}
