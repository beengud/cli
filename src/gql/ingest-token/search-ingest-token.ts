import type { Config } from "../../lib/config";
import {
  SearchIngestTokenDocument,
  type SearchIngestTokenQuery,
  type SearchIngestTokenQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlIngestToken =
  SearchIngestTokenQuery["searchIngestToken"]["results"][number];

export async function searchIngestToken(
  config: Config,
  variables?: SearchIngestTokenQueryVariables,
): Promise<GqlIngestToken[]> {
  const response = await executeGraphQL(
    config,
    SearchIngestTokenDocument,
    variables,
  );
  return response.data.searchIngestToken.results;
}
