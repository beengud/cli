import type { Config } from "../../lib/config";
import {
  SaveDatasetDryRunDocument,
  type SaveDatasetDryRunMutation,
  type SaveDatasetDryRunMutationVariables,
} from "../generated/graphql";
import { executeGraphQL } from "../gql-request";

/** The DatasetSaveResult returned from a dry-run saveDataset. */
export type DryRunSaveResult = SaveDatasetDryRunMutation["saveDataset"];

/**
 * Dry-run a dataset pipeline save. Uses `saveDataset` with
 * `dependencyHandling.saveMode = PreflightDatasetAndDependencies`, which
 * computes what the save would do without persisting anything: the dataset
 * that would be saved, datasets that would be dematerialized/rematerialized,
 * and any compile/validation errors in affected datasets.
 */
export async function saveDatasetDryRun(
  config: Config,
  variables: SaveDatasetDryRunMutationVariables,
): Promise<DryRunSaveResult> {
  const response = await executeGraphQL(
    config,
    SaveDatasetDryRunDocument,
    variables,
  );
  return response.data.saveDataset;
}
