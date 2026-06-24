import type { Config } from "../../lib/config";
import {
  ListRbacUsersDocument,
  type ListRbacUsersQuery,
  GetRbacUserDocument,
  type GetRbacUserQuery,
  type GetRbacUserQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

type CurrentCustomer = NonNullable<ListRbacUsersQuery["currentCustomer"]>;
export type RbacUser = CurrentCustomer["users"][number];

export async function listRbacUsers(config: Config): Promise<RbacUser[]> {
  const response = await executeGraphQL(config, ListRbacUsersDocument);
  return response.data.currentCustomer?.users ?? [];
}

export async function getRbacUser(
  config: Config,
  variables: GetRbacUserQueryVariables,
): Promise<GetRbacUserQuery["user"]> {
  const response = await executeGraphQL(config, GetRbacUserDocument, variables);
  return response.data.user;
}
