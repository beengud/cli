import type { Config } from "../../lib/config";
import {
  ListRbacStatementsDocument,
  type ListRbacStatementsQuery,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type RbacStatement = ListRbacStatementsQuery["rbacStatements"][number];

export async function listRbacStatements(
  config: Config,
): Promise<RbacStatement[]> {
  const response = await executeGraphQL(config, ListRbacStatementsDocument);
  return response.data.rbacStatements;
}
