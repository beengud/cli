import type { Config } from "../../lib/config";
import {
  InstallTracingContentDocument,
  type InstallTracingContentMutation,
  type InstallTracingContentMutationVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlTracingContent =
  InstallTracingContentMutation["installTracingContent"];

export async function installTracingContent(
  config: Config,
  variables?: InstallTracingContentMutationVariables,
): Promise<GqlTracingContent> {
  const response = await executeGraphQL(
    config,
    InstallTracingContentDocument,
    variables,
  );
  return response.data.installTracingContent;
}
