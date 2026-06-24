import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { saveDatasetDryRun } from "../../gql/dataset/save-dataset-dry-run";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";
import { readDatasetInput } from "./input";

export interface DryRunDeps {
  loadConfig?: typeof loadConfig;
  readDatasetInput?: typeof readDatasetInput;
  saveDatasetDryRun?: typeof saveDatasetDryRun;
}

/**
 * Dry-run saving a dataset pipeline. Nothing is persisted. Reports the dataset
 * that would be saved, datasets that would be dematerialized/rematerialized,
 * and any compile/validation errors. Exits 1 if any error datasets are
 * returned.
 */
export async function dryRun(
  this: LocalContext,
  _flags: Record<string, never>,
  file: string,
  deps: DryRunDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    readDatasetInput: readDatasetInputImpl = readDatasetInput,
    saveDatasetDryRun: saveDatasetDryRunImpl = saveDatasetDryRun,
  } = deps;
  const { process, writer } = this;

  try {
    const variables = readDatasetInputImpl(file);
    const config = loadConfigImpl();
    const result = await saveDatasetDryRunImpl(config, variables);

    if (result?.dataset) {
      writer.write(`Dataset: ${result.dataset.name} (${result.dataset.id})`);
    }

    for (const demat of result?.dematerializedDatasets ?? []) {
      if (demat.dataset) {
        writer.write(
          `Would rematerialize: ${demat.dataset.name} (${demat.dataset.id})`,
        );
      }
    }

    let hasErrors = false;
    for (const errDs of result?.errorDatasets ?? []) {
      writer.write(`Error in ${errDs.datasetName}: ${errDs.text}`);
      hasErrors = true;
    }

    if (hasErrors) {
      process.exit(1);
    }
  } catch (error) {
    if (error instanceof GqlApiError) {
      writer.error(`API Error (${error.statusCode}): ${error.message}`);
    } else {
      const message = error instanceof Error ? error.message : String(error);
      writer.error(`Error: ${message}`);
    }
    process.exit(1);
  }
}

export const dryRunCommand = buildCommand({
  loader: async () => dryRun,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Path to dataset pipeline JSON file",
          parse: String,
        },
      ],
    },
    flags: {},
  },
  docs: {
    brief: "Dry-run saving a dataset pipeline (nothing is persisted)",
  },
});
