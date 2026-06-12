import type { Config } from "../../lib/config";
import {
  DatasetQueryOutputDocument,
  type DatasetQueryOutputQuery,
  type DatasetQueryOutputQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

/** A single TaskResult returned from datasetQueryOutput */
export type GqlDatasetQueryTaskResult =
  DatasetQueryOutputQuery["datasetQueryOutput"][number];

/** Field descriptor returned alongside query results */
export type GqlDatasetQueryField = NonNullable<
  NonNullable<GqlDatasetQueryTaskResult["resultSchema"]>["fieldList"]
>[number];

/**
 * Shape of the PaginatedResults scalar: column-major data plus pagination
 * metadata. Each entry in `columns` is a column whose values map to rows in
 * `fieldList` order.
 */
export interface PaginatedResults {
  cursorId?: string | null;
  sfQid?: string | null;
  totalRows?: string | number;
  offset?: string | number;
  numRows?: string | number;
  columns?: unknown[][];
}

/**
 * Execute an OPAL query against one or more dataset inputs using the
 * `datasetQueryOutput` GraphQL query and return the raw TaskResult array.
 */
export async function datasetQueryOutput({
  config,
  variables,
}: {
  config: Config;
  variables: DatasetQueryOutputQueryVariables;
}) {
  const response = await executeGraphQL(
    config,
    DatasetQueryOutputDocument,
    variables,
  );
  return response.data.datasetQueryOutput;
}
