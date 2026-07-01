import { defineCommand } from "../../lib/stricli-wrappers";
import chalk from "chalk";
import * as fs from "node:fs";
import type { LocalContext } from "../../context";
import { datasetImpact } from "../../gql/dataset/dataset-analysis";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";
import {
  formatTable,
  createColumnHelper,
  type ColumnDef,
} from "../../lib/formatters/table";

interface DatasetCmdInput {
  workspaceId: string;
  dataset: Record<string, unknown>;
  query: Record<string, unknown>;
}

interface AffectedRow {
  name: string;
  id: string;
  dependencyType: string;
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

const col = createColumnHelper<AffectedRow>();

const columns: ColumnDef<AffectedRow>[] = [
  col.accessor((row) => row.name, { header: "NAME" }),
  col.accessor((row) => row.id, {
    header: "ID",
    format: (value) => chalk.cyan(value),
  }),
  col.accessor((row) => row.dependencyType, { header: "DEPENDENCY" }),
];

async function impact(
  this: LocalContext,
  _flags: Record<string, never>,
  file: string,
): Promise<void> {
  const { process, writer } = this;

  try {
    const input = readDatasetInput(file);
    const config = loadConfig();
    const result = await datasetImpact(config, {
      workspaceId: input.workspaceId,
      dataset: input.dataset,
      query: input.query,
    });

    const rows: AffectedRow[] = (result.affectedDatasets ?? []).map((a) => ({
      name: a.dataset?.name ?? "",
      id: a.dataset?.id ?? "",
      dependencyType: a.dependencyType ?? "",
    }));

    if (rows.length > 0) {
      writer.write(formatTable(rows, columns));
    } else {
      writer.warn("No affected datasets.");
    }

    for (const errDs of result.errorDatasets ?? []) {
      writer.error(
        `Error in ${errDs.dataset?.name ?? ""}: ${errDs.errorText ?? ""}`,
      );
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

export const impactCommand = defineCommand({
  loader: async () => impact,
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
    brief: "Report datasets affected by a dataset pipeline change",
    fullDescription:
      "Report downstream datasets affected by a dataset change.\n\n" +
      "NOTE: not verified against the current tenant — the " +
      "getDatasetsAffectedByDatasetUpdate result schema has drifted (see " +
      "src/gql/dataset/dataset-analysis.ts). Works on tenants exposing the " +
      "legacy schema; re-derive once introspection is available.",
  },
});
