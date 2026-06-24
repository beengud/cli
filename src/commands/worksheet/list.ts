import { buildCommand } from "@stricli/core";
import chalk from "chalk";
import type { LocalContext } from "../../context";
import { listWorksheets, type GqlWorksheet } from "../../gql/worksheet/list-worksheets";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";
import { filterByName } from "../../lib/filter";
import { renderAsCSV } from "../../lib/formatters/csv";
import {
  createColumnHelper,
  formatTable,
  type ColumnDef,
} from "../../lib/formatters/table";
import { muteStatusWriter } from "../../lib/writer";

type OutputFormat = "json" | "csv";

interface ListWorksheetsFlags {
  name?: string;
  workspace?: string;
  format?: OutputFormat;
}

export interface ListWorksheetsDeps {
  loadConfig?: typeof loadConfig;
  listWorksheets?: typeof listWorksheets;
}

const col = createColumnHelper<GqlWorksheet>();

const COLUMNS: ColumnDef<GqlWorksheet>[] = [
  col.accessor((row) => row.id, {
    header: "ID",
    format: (value) => chalk.cyan(value),
  }),
  col.accessor((row) => row.name, { header: "NAME", flex: true }),
];

export async function list(
  this: LocalContext,
  flags: ListWorksheetsFlags,
  deps: ListWorksheetsDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    listWorksheets: listWorksheetsImpl = listWorksheets,
  } = deps;
  const { process, writer: _writer } = this;
  const writer = muteStatusWriter(_writer, {
    muted: flags.format === "json" || flags.format === "csv",
  });

  try {
    const config = loadConfigImpl();

    // worksheetSearch.terms.workspaceId is a list; pass the selected
    // workspace when provided so the server scopes the search.
    const worksheets = await listWorksheetsImpl(config, {
      terms: {
        ...(flags.workspace ? { workspaceId: [flags.workspace] } : {}),
        ...(flags.name ? { name: [flags.name] } : {}),
      },
    });

    // The server search is fuzzy; apply the case-insensitive substring filter
    // client-side to match the old CLI's contract.
    const filtered = filterByName(worksheets, flags.name);

    if (flags.format === "json") {
      writer.write(JSON.stringify(filtered, null, 2));
      return;
    }

    if (flags.format === "csv") {
      writer.write(renderAsCSV(filtered));
      return;
    }

    if (filtered.length === 0) {
      writer.warn("No worksheets found.");
      return;
    }

    writer.write(formatTable(filtered, COLUMNS));
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

export const listCommand = buildCommand({
  loader: async () => list,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [],
    },
    flags: {
      name: {
        kind: "parsed",
        parse: String,
        brief: "Filter worksheets by name substring (case-insensitive)",
        optional: true,
      },
      workspace: {
        kind: "parsed",
        parse: String,
        brief: "Workspace ID to list worksheets from",
        optional: true,
      },
      format: {
        kind: "enum",
        values: ["json", "csv"],
        brief: "Output format (json, csv)",
        optional: true,
      },
    },
  },
  docs: {
    brief: "List worksheets",
  },
});
