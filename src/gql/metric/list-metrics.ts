import type { Config } from "../../lib/config";
import {
  ListMetricsDocument,
  type ListMetricsQuery,
  type ListMetricsQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

/** Metric match type from the search query (kept for backwards compat). */
export type GqlMetricMatch =
  ListMetricsQuery["metricSearch"]["matches"][number];

/** Metric type from the search query (kept for backwards compat). */
export type GqlMetric = GqlMetricMatch["metric"];

/** Dataset info from the search query. */
export type GqlMetricDataset =
  ListMetricsQuery["metricSearch"]["datasets"][number];

/**
 * Search metrics using GraphQL, projecting the result into the canonical
 * REST `MetricsResponse` envelope so the command layer can dispatch
 * uniformly with the KG path. `meta.totalCount` carries the GQL
 * `numSearched` value, which is a true population total on this path.
 */
export async function listMetrics(
  config: Config,
  options: ListMetricsQueryVariables,
) {
  const response = await executeGraphQL(config, ListMetricsDocument, options);
  return response.data.metricSearch;
}
