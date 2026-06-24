import type { Config } from "../../lib/config";
import {
  SaveWorksheetDocument,
  type SaveWorksheetMutation,
  type SaveWorksheetMutationVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type { WorksheetInput } from "../generated/graphql";

export type GqlSavedWorksheet = SaveWorksheetMutation["saveWorksheet"];

export async function saveWorksheet(
  config: Config,
  variables: SaveWorksheetMutationVariables,
): Promise<GqlSavedWorksheet> {
  const response = await executeGraphQL(
    config,
    SaveWorksheetDocument,
    variables,
  );
  return response.data.saveWorksheet;
}
