import type { Config } from "../../lib/config";
import {
  GetKubernetesContentDocument,
  type GetKubernetesContentQuery,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlKubernetesContent =
  GetKubernetesContentQuery["getKubernetesContent"];

export async function getKubernetesContent(
  config: Config,
): Promise<GqlKubernetesContent> {
  const response = await executeGraphQL(config, GetKubernetesContentDocument);
  return response.data.getKubernetesContent;
}
