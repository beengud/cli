import type { Config } from "../../lib/config";
import {
  UpdateDatastreamDocument,
  type UpdateDatastreamMutation,
  type UpdateDatastreamMutationVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlDatastream = UpdateDatastreamMutation["updateDatastream"];

export async function updateDatastream(
  config: Config,
  variables: UpdateDatastreamMutationVariables,
): Promise<GqlDatastream> {
  const response = await executeGraphQL(
    config,
    UpdateDatastreamDocument,
    variables,
  );
  return response.data.updateDatastream;
}
