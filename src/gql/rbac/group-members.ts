import type { Config } from "../../lib/config";
import {
  ListRbacGroupmembersDocument,
  type ListRbacGroupmembersQuery,
  GetRbacGroupmemberDocument,
  type GetRbacGroupmemberQuery,
  type GetRbacGroupmemberQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type RbacGroupmember =
  ListRbacGroupmembersQuery["rbacGroupmembers"][number];

export async function listRbacGroupmembers(
  config: Config,
): Promise<RbacGroupmember[]> {
  const response = await executeGraphQL(config, ListRbacGroupmembersDocument);
  return response.data.rbacGroupmembers;
}

export async function getRbacGroupmember(
  config: Config,
  variables: GetRbacGroupmemberQueryVariables,
): Promise<GetRbacGroupmemberQuery["rbacGroupmember"]> {
  const response = await executeGraphQL(
    config,
    GetRbacGroupmemberDocument,
    variables,
  );
  return response.data.rbacGroupmember;
}
