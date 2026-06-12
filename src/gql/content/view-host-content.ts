import type { Config } from "../../lib/config";
import {
  GetHostContentDocument,
  type GetHostContentQuery,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlHostContent = GetHostContentQuery["hostExplorerContent"];

export async function getHostContent(config: Config): Promise<GqlHostContent> {
  const response = await executeGraphQL(config, GetHostContentDocument);
  return response.data.hostExplorerContent;
}
