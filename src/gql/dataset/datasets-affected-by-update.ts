import type { Config } from "../../lib/config";
import {
  DatasetsAffectedByUpdateDocument,
  type DatasetsAffectedByUpdateQuery,
  type DatasetsAffectedByUpdateQueryVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

/** The DatasetsAffectedByDatasetUpdateResult returned by the impact query. */
export type DatasetsAffectedResult =
  DatasetsAffectedByUpdateQuery["getDatasetsAffectedByDatasetUpdate"];

/**
 * Compute the downstream datasets that would be affected (dematerialized) if
 * the given dataset were saved with the supplied pipeline, without persisting
 * anything.
 */
export async function getDatasetsAffectedByUpdate(
  config: Config,
  variables: DatasetsAffectedByUpdateQueryVariables,
): Promise<DatasetsAffectedResult> {
  const response = await executeGraphQL(
    config,
    DatasetsAffectedByUpdateDocument,
    variables,
  );
  return response.data.getDatasetsAffectedByDatasetUpdate;
}
