import { defineCommand } from "../../lib/stricli-wrappers";
import * as fs from "node:fs";
import type { LocalContext } from "../../context";
import { datasetDryRun } from "../../gql/dataset/dataset-analysis";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

interface DatasetCmdInput {
  workspaceId: string;
  dataset: Record<string, unknown>;
  query: Record<string, unknown>;
}

function readDatasetInput(file: string): DatasetCmdInput {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as DatasetCmdInput;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`dataset: could not read or parse "${file}": ${message}`, {
      cause: error,
    });
  }
}

async function dryRun(
  this: LocalContext,
  _flags: Record<string, never>,
  file: string,
): Promise<void> {
  const { process, writer } = this;

  try {
    const input = readDatasetInput(file);
    const config = loadConfig();
    const result = await datasetDryRun(config, {
      workspaceId: input.workspaceId,
      dataset: input.dataset,
      query: input.query,
    });

    if (result.dataset) {
      writer.write(
        `Dataset: ${result.dataset.name ?? ""} (${result.dataset.id ?? ""})`,
      );
    }
    for (const ds of result.dematerializedDatasets ?? []) {
      writer.write(`Would rematerialize: ${ds.name ?? ""} (${ds.id ?? ""})`);
    }

    let hasErrors = false;
    for (const errDs of result.errorDatasets ?? []) {
      writer.write(
        `Error in ${errDs.dataset?.name ?? ""}: ${errDs.errorText ?? ""}`,
      );
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

export const dryRunCommand = defineCommand({
  loader: async () => dryRun,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Path to a JSON file with { workspaceId, dataset, query }",
          parse: String,
        },
      ],
    },
    flags: {},
  },
  docs: {
    brief: "Dry-run a dataset pipeline change and report rematerialization",
    fullDescription:
      "Dry-run a dataset pipeline change.\n\n" +
      "NOTE: not verified against the current tenant — the saveDatasetDryRun " +
      "mutation has drifted (see src/gql/dataset/dataset-analysis.ts). Works on " +
      "tenants exposing the legacy schema; re-derive once introspection is " +
      "available.",
  },
});
