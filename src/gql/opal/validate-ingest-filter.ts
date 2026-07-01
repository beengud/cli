import type { Config } from "../../lib/config";
import {
  ValidateIngestFilterDocument,
  type ValidateIngestFilterQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

// Mirrors gqlValidateIngestFilter in the Go fork (cmd_opal_validate.go). Uses
// the generated ValidateIngestFilter operation (present in the codegen
// snapshot). The API returns only { message } diagnostics; an empty array
// means the expression is valid.
export async function validateIngestFilter(
  config: Config,
  variables: ValidateIngestFilterQueryVariables,
) {
  const response = await executeGraphQL(
    config,
    ValidateIngestFilterDocument,
    variables,
  );
  // A null result means the expression is valid; normalize to an empty array.
  return response.data.validateIngestFilterExpression ?? [];
}
