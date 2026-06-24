import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { getDatasetsAffectedByUpdate } from "../../gql/dataset/datasets-affected-by-update";
import { saveDatasetDryRun } from "../../gql/dataset/save-dataset-dry-run";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";
import { renderAsCSV } from "../../lib/formatters/csv";
import { createColumnHelper, formatTable } from "../../lib/formatters/table";
import { muteStatusWriter } from "../../lib/writer";
import { readDatasetInput } from "./input";

type OutputFormat = "json" | "csv";

interface ImpactFlags {
  format?: OutputFormat;
  json?: boolean;
}

/** A single downstream dataset affected by the proposed update. */
interface AffectedDataset {
  name: string;
  id: string;
  /** How the dataset is impacted (e.g. dematerialized). */
  impact: string;
}

export interface ImpactDeps {
  loadConfig?: typeof loadConfig;
  readDatasetInput?: typeof readDatasetInput;
  getDatasetsAffectedByUpdate?: typeof getDatasetsAffectedByUpdate;
  saveDatasetDryRun?: typeof saveDatasetDryRun;
}

const columns = createColumnHelper<AffectedDataset>();
const tableColumns = [
  columns.accessor((row) => row.name, { header: "NAME", flex: true }),
  columns.accessor((row) => row.id, { header: "ID" }),
  columns.accessor((row) => row.impact, { header: "IMPACT" }),
];

/**
 * Report the downstream datasets affected if the given dataset pipeline were
 * saved. Affected datasets are rendered as a table (or JSON/CSV); any
 * compile/validation errors are written to stderr. Nothing is persisted.
 */
export async function impact(
  this: LocalContext,
  flags: ImpactFlags,
  file: string,
  deps: ImpactDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    readDatasetInput: readDatasetInputImpl = readDatasetInput,
    getDatasetsAffectedByUpdate: getAffectedImpl = getDatasetsAffectedByUpdate,
    saveDatasetDryRun: dryRunImpl = saveDatasetDryRun,
  } = deps;

  const format = flags.json ? ("json" as const) : flags.format;
  const { process, writer: baseWriter } = this;
  const writer = muteStatusWriter(baseWriter, {
    muted: format === "json" || format === "csv",
  });

  try {
    const variables = readDatasetInputImpl(file);
    const config = loadConfigImpl();

    const affected = await getAffectedImpl(config, variables);

    const rows: AffectedDataset[] = [];
    for (const demat of affected?.dematerializedDatasets ?? []) {
      if (demat.dataset) {
        rows.push({
          name: demat.dataset.name,
          id: demat.dataset.id,
          impact: "dematerialized",
        });
      }
    }
    for (const demat of affected?.editForwardDematerializedDatasets ?? []) {
      if (demat.dataset) {
        rows.push({
          name: demat.dataset.name,
          id: demat.dataset.id,
          impact: "edit-forward-dematerialized",
        });
      }
    }

    if (format === "json") {
      writer.write(JSON.stringify(rows, null, 2));
    } else if (format === "csv") {
      writer.write(renderAsCSV(rows));
    } else {
      writer.write(formatTable(rows, tableColumns));
    }

    // Surface compile/validation errors on stderr. The affected-datasets query
    // does not return errors, so we obtain them from the preflight dry-run.
    const dryRunResult = await dryRunImpl(config, variables);
    for (const errDs of dryRunResult?.errorDatasets ?? []) {
      writer.error(`Error in ${errDs.datasetName}: ${errDs.text}`);
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

export const impactCommand = buildCommand({
  loader: async () => impact,
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
    flags: {
      format: {
        kind: "enum",
        values: ["json", "csv"],
        brief: "Output format (json, csv)",
        optional: true,
      },
      json: {
        kind: "boolean",
        brief: "Output as JSON (shorthand for --format=json)",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Show downstream datasets affected by saving a dataset pipeline",
  },
});
