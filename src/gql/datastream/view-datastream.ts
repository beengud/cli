import type { Config } from "../../lib/config";
import {
  GetDatastreamDocument,
  type GetDatastreamQuery,
  type GetDatastreamQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlDatastream = GetDatastreamQuery["datastream"];

export async function viewDatastream(
  config: Config,
  variables: GetDatastreamQueryVariables,
): Promise<GqlDatastream> {
  const response = await executeGraphQL(
    config,
    GetDatastreamDocument,
    variables,
  );
  return response.data.datastream;
}
