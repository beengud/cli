import type { Config } from "../../lib/config";
import {
  UpdateHostContentDocument,
  type UpdateHostContentMutation,
  type UpdateHostContentMutationVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlHostContent =
  UpdateHostContentMutation["updateHostExplorerContent"];

export async function updateHostContent(
  config: Config,
  variables: UpdateHostContentMutationVariables,
): Promise<GqlHostContent> {
  const response = await executeGraphQL(
    config,
    UpdateHostContentDocument,
    variables,
  );
  return response.data.updateHostExplorerContent;
}
