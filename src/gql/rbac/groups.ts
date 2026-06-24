import type { Config } from "../../lib/config";
import {
  ListRbacGroupsDocument,
  type ListRbacGroupsQuery,
  GetRbacGroupDocument,
  type GetRbacGroupQuery,
  type GetRbacGroupQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type RbacGroup = ListRbacGroupsQuery["rbacGroups"][number];

export async function listRbacGroups(config: Config): Promise<RbacGroup[]> {
  const response = await executeGraphQL(config, ListRbacGroupsDocument);
  return response.data.rbacGroups;
}

export async function getRbacGroup(
  config: Config,
  variables: GetRbacGroupQueryVariables,
): Promise<GetRbacGroupQuery["rbacGroup"]> {
  const response = await executeGraphQL(
    config,
    GetRbacGroupDocument,
    variables,
  );
  return response.data.rbacGroup;
}
