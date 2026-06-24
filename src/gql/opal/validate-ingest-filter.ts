import type { Config } from "../../lib/config";
import {
  ValidateIngestFilterDocument,
  type ValidateIngestFilterQuery,
  type ValidateIngestFilterQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type IngestFilterDiagnostic =
  ValidateIngestFilterQuery["validateIngestFilterExpression"] extends
    | (infer T)[]
    | null
    | undefined
    ? T
    : never;

export async function validateIngestFilter(
  config: Config,
  variables: ValidateIngestFilterQueryVariables,
): Promise<ValidateIngestFilterQuery["validateIngestFilterExpression"]> {
  const response = await executeGraphQL(
    config,
    ValidateIngestFilterDocument,
    variables,
  );
  return response.data.validateIngestFilterExpression;
}
