import type { Config } from "../../lib/config";
import {
  CheckQueriesDocument,
  type CheckQueriesQuery,
  type CheckQueriesQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

// Mirrors gqlCheckQueries in the Go fork (cmd_opal.go). Uses the generated
// CheckQueries operation (one of the few present in the codegen snapshot).
export type CheckQueriesResult = CheckQueriesQuery["checkQueries"][number];

export async function checkQueries(
  config: Config,
  variables: CheckQueriesQueryVariables,
) {
  const response = await executeGraphQL(
    config,
    CheckQueriesDocument,
    variables,
  );
  // checkQueries returns one result per stage; the Go fork reads index 0.
  return response.data.checkQueries[0] ?? null;
}
