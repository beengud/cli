import type { Config } from "../../lib/config";
import {
  CreateIngestTokenDocument,
  type CreateIngestTokenMutation,
  type CreateIngestTokenMutationVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlIngestToken = CreateIngestTokenMutation["createIngestToken"];

export async function createIngestToken(
  config: Config,
  variables: CreateIngestTokenMutationVariables,
): Promise<GqlIngestToken> {
  const response = await executeGraphQL(
    config,
    CreateIngestTokenDocument,
    variables,
  );
  return response.data.createIngestToken;
}
