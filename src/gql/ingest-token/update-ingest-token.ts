import type { Config } from "../../lib/config";
import {
  UpdateIngestTokenDocument,
  type UpdateIngestTokenMutation,
  type UpdateIngestTokenMutationVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlIngestToken = UpdateIngestTokenMutation["updateIngestToken"];

export async function updateIngestToken(
  config: Config,
  variables: UpdateIngestTokenMutationVariables,
): Promise<GqlIngestToken> {
  const response = await executeGraphQL(
    config,
    UpdateIngestTokenDocument,
    variables,
  );
  return response.data.updateIngestToken;
}
