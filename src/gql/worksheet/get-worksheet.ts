import type { Config } from "../../lib/config";
import {
  GetWorksheetDocument,
  type GetWorksheetQuery,
  type GetWorksheetQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

export type GqlWorksheetDetail = NonNullable<GetWorksheetQuery["worksheet"]>;

export async function getWorksheet(
  config: Config,
  variables: GetWorksheetQueryVariables,
): Promise<GqlWorksheetDetail | null> {
  const response = await executeGraphQL(
    config,
    GetWorksheetDocument,
    variables,
  );
  return response.data.worksheet;
}
