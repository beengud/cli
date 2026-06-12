import type { Config } from "../../lib/config";
import {
  CreateDatastreamDocument,
  type CreateDatastreamMutation,
  type CreateDatastreamMutationVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlDatastream = CreateDatastreamMutation["createDatastream"];

export async function createDatastream(
  config: Config,
  variables: CreateDatastreamMutationVariables,
): Promise<GqlDatastream> {
  const response = await executeGraphQL(
    config,
    CreateDatastreamDocument,
    variables,
  );
  return response.data.createDatastream;
}
