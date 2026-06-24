import type { Config } from "../../lib/config";
import {
  DeleteWorksheetDocument,
  type DeleteWorksheetMutation,
  type DeleteWorksheetMutationVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlDeleteWorksheetResult =
  DeleteWorksheetMutation["deleteWorksheet"];

export async function deleteWorksheet(
  config: Config,
  variables: DeleteWorksheetMutationVariables,
): Promise<GqlDeleteWorksheetResult> {
  const response = await executeGraphQL(
    config,
    DeleteWorksheetDocument,
    variables,
  );
  return response.data.deleteWorksheet;
}
