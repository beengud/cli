import type { Config } from "../../lib/config";
import {
  GetMetricDocument,
  type GetMetricQuery,
  type GetMetricQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

/** Metric match type from the get query (includes heuristics) */
export type GqlMetricDetail = GetMetricQuery["metricSearch"]["matches"][number];

/** Metric type with full details */
export type GqlMetricFull = GqlMetricDetail["metric"];

/** Heuristics type */
export type GqlMetricHeuristics = NonNullable<GqlMetricFull["heuristics"]>;

/** Dataset info from the get query */
export type GqlMetricDatasetDetail =
  GetMetricQuery["metricSearch"]["datasets"][number];

export interface GetMetricResult {
  match: GqlMetricDetail | null;
  dataset: GqlMetricDatasetDetail | null;
}

/**
 * Get a metric by exact name match using GraphQL
 * Optionally filter by dataset ID
 */
export async function getMetric(
  config: Config,
  name: string,
  datasetId?: string,
): Promise<GetMetricResult> {
  const variables: GetMetricQueryVariables = {
    match: name,
    inDatasets: datasetId ? [datasetId] : undefined,
    heuristicsOptions: {
      inclusionOption: "Everything",
      globalLimit: "100",
    },
  };

  const response = await executeGraphQL(config, GetMetricDocument, variables);

  // Find exact match by name
  const match =
    response.data.metricSearch.matches.find(
      (m) => m.metric.name === name || m.metric.nameWithPath === name,
    ) ?? null;

  // Find the dataset for this metric
  const dataset = match?.datasetId
    ? (response.data.metricSearch.datasets.find(
        (d) => d.id === match.datasetId,
      ) ?? null)
    : null;

  return { match, dataset };
}
