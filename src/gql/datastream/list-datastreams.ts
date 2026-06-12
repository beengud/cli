import type { Config } from "../../lib/config";
import {
  ListDatastreamsDocument,
  type ListDatastreamsQuery,
  type ListDatastreamsQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlDatastream = ListDatastreamsQuery["datastreams"][number];

export async function listDatastreams(
  config: Config,
  variables?: ListDatastreamsQueryVariables,
): Promise<GqlDatastream[]> {
  const response = await executeGraphQL(
    config,
    ListDatastreamsDocument,
    variables,
  );
  return response.data.datastreams;
}
