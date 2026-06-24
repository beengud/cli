import type { Config } from "../../lib/config";
import {
  SaveBoardDocument,
  type SaveBoardMutation,
  type SaveBoardMutationVariables,
  GetBoardDocument,
  type GetBoardQuery,
  type GetBoardQueryVariables,
  SearchBoardsDocument,
  type SearchBoardsQuery,
  type SearchBoardsQueryVariables,
  DeleteBoardDocument,
  type DeleteBoardMutationVariables,
  SetDefaultDashboardDocument,
  type SetDefaultDashboardMutationVariables,
  ClearDefaultDashboardDocument,
  type ClearDefaultDashboardMutationVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlSavedBoard = SaveBoardMutation["saveDashboard"];
export type GqlBoard = GetBoardQuery["dashboard"];
export type GqlBoardSearchItem =
  SearchBoardsQuery["dashboardSearch"]["dashboards"][number];

/** Create or update a dashboard via saveDashboard (update when input.id is set). */
export async function saveBoard(
  config: Config,
  variables: SaveBoardMutationVariables,
): Promise<GqlSavedBoard> {
  const response = await executeGraphQL(config, SaveBoardDocument, variables);
  return response.data.saveDashboard;
}

/** Fetch a single dashboard by ID. */
export async function getBoard(
  config: Config,
  variables: GetBoardQueryVariables,
): Promise<GqlBoard> {
  const response = await executeGraphQL(config, GetBoardDocument, variables);
  return response.data.dashboard;
}

/** Search dashboards by optional name/workspace/folder terms. */
export async function searchBoards(
  config: Config,
  variables: SearchBoardsQueryVariables,
): Promise<GqlBoardSearchItem[]> {
  const response = await executeGraphQL(
    config,
    SearchBoardsDocument,
    variables,
  );
  return response.data.dashboardSearch.dashboards;
}

/** Delete a dashboard by ID. Throws if the API reports a failure. */
export async function deleteBoard(
  config: Config,
  variables: DeleteBoardMutationVariables,
): Promise<void> {
  const response = await executeGraphQL(config, DeleteBoardDocument, variables);
  const result = response.data.deleteDashboard;
  if (!result.success && result.errorMessage) {
    throw new Error(result.errorMessage);
  }
}

/** Set the default dashboard for a dataset. Throws if the API reports a failure. */
export async function setDefaultDashboard(
  config: Config,
  variables: SetDefaultDashboardMutationVariables,
): Promise<void> {
  const response = await executeGraphQL(
    config,
    SetDefaultDashboardDocument,
    variables,
  );
  const result = response.data.setDefaultDashboard;
  if (!result.success && result.errorMessage) {
    throw new Error(result.errorMessage);
  }
}

/** Clear the default dashboard for a dataset. Throws if the API reports a failure. */
export async function clearDefaultDashboard(
  config: Config,
  variables: ClearDefaultDashboardMutationVariables,
): Promise<void> {
  const response = await executeGraphQL(
    config,
    ClearDefaultDashboardDocument,
    variables,
  );
  const result = response.data.clearDefaultDashboard;
  if (!result.success && result.errorMessage) {
    throw new Error(result.errorMessage);
  }
}
