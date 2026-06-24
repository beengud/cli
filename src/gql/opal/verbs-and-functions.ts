import type { Config } from "../../lib/config";
import {
  VerbsAndFunctionsDocument,
  type VerbsAndFunctionsQuery,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type VerbsAndFunctions = VerbsAndFunctionsQuery["verbsAndFunctions"];
export type OpalVerb = VerbsAndFunctions["verbs"][number];
export type OpalFunction = VerbsAndFunctions["functions"][number];

export async function verbsAndFunctions(
  config: Config,
): Promise<VerbsAndFunctions> {
  const response = await executeGraphQL(config, VerbsAndFunctionsDocument);
  return response.data.verbsAndFunctions;
}
