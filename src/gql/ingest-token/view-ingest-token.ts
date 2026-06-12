import type { Config } from "../../lib/config";
import {
  GetIngestTokenDocument,
  type GetIngestTokenQuery,
  type GetIngestTokenQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlIngestToken = GetIngestTokenQuery["ingestToken"];

export async function viewIngestToken(
  config: Config,
  variables: GetIngestTokenQueryVariables,
): Promise<GqlIngestToken> {
  const response = await executeGraphQL(
    config,
    GetIngestTokenDocument,
    variables,
  );
  return response.data.ingestToken;
}
