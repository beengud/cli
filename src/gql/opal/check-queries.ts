import type { Config } from "../../lib/config";
import {
  CheckQueriesDocument,
  type CheckQueriesQuery,
  type CheckQueriesQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type CheckQueriesResult = CheckQueriesQuery["checkQueries"][number];

export async function checkQueries(
  config: Config,
  variables: CheckQueriesQueryVariables,
): Promise<CheckQueriesResult | undefined> {
  const response = await executeGraphQL(
    config,
    CheckQueriesDocument,
    variables,
  );
  return response.data.checkQueries[0];
}
