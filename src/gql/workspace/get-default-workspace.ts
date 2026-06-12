import type { Config } from "../../lib/config";
import {
  GetDefaultWorkspaceDocument,
  type GetDefaultWorkspaceQuery,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

/** Workspace type from the query */
export type GqlWorkspace = NonNullable<
  GetDefaultWorkspaceQuery["currentUser"]
>["workspaces"][number];

export interface GetDefaultWorkspaceResult {
  workspace: GqlWorkspace | null;
}

/**
 * Get the default workspace using GraphQL
 */
export async function getDefaultWorkspace(
  config: Config,
): Promise<GetDefaultWorkspaceResult> {
  const response = await executeGraphQL(
    config,
    GetDefaultWorkspaceDocument,
    {},
  );

  return {
    workspace: response.data.currentUser?.workspaces[0] ?? null,
  };
}
