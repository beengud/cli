import type { Config } from "../../lib/config";
import {
  UpdateKubernetesContentDocument,
  type UpdateKubernetesContentMutation,
  type UpdateKubernetesContentMutationVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlKubernetesContent =
  UpdateKubernetesContentMutation["updateKubernetesContent"];

export async function updateKubernetesContent(
  config: Config,
  variables: UpdateKubernetesContentMutationVariables,
): Promise<GqlKubernetesContent> {
  const response = await executeGraphQL(
    config,
    UpdateKubernetesContentDocument,
    variables,
  );
  return response.data.updateKubernetesContent;
}
