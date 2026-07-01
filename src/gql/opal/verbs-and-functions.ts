import type { Config } from "../../lib/config";
import {
  VerbsAndFunctionsDocument,
  type VerbsAndFunctionsQuery,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

// Mirrors gqlVerbsAndFunctions in the Go fork (ot_opal.go). Uses the generated
// VerbsAndFunctions operation (present in the codegen snapshot).
export type OpalVerb =
  VerbsAndFunctionsQuery["verbsAndFunctions"]["verbs"][number];
export type OpalFunction =
  VerbsAndFunctionsQuery["verbsAndFunctions"]["functions"][number];

export async function verbsAndFunctions(config: Config) {
  const response = await executeGraphQL(config, VerbsAndFunctionsDocument, {});
  return response.data.verbsAndFunctions;
}
