import type { Config } from "../../lib/config";
import {
  ListWorksheetsDocument,
  type ListWorksheetsQuery,
  type ListWorksheetsQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlWorksheet =
  ListWorksheetsQuery["worksheetSearch"]["worksheets"][number]["worksheet"];

export async function listWorksheets(
  config: Config,
  variables: ListWorksheetsQueryVariables,
): Promise<GqlWorksheet[]> {
  const response = await executeGraphQL(
    config,
    ListWorksheetsDocument,
    variables,
  );
  return response.data.worksheetSearch.worksheets.map((r) => r.worksheet);
}
