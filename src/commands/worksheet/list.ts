import { defineCommand } from "../../lib/stricli-wrappers";
import chalk from "chalk";
import type { LocalContext } from "../../context";
import {
  searchWorksheets,
  type WorksheetListEntry,
} from "../../gql/worksheet/worksheet";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";
import { muteStatusWriter } from "../../lib/writer";
import {
  formatTable,
  createColumnHelper,
  type ColumnDef,
} from "../../lib/formatters/table";
import { renderAsCSV } from "../../lib/formatters/csv";

type OutputFormat = "json" | "csv";

interface ListWorksheetsFlags {
  workspace: string;
  name?: string;
  format?: OutputFormat;
  json?: boolean;
}

const col = createColumnHelper<WorksheetListEntry>();

const columns: ColumnDef<WorksheetListEntry>[] = [
  col.accessor((row) => row.id, {
    header: "ID",
    format: (value) => chalk.cyan(value),
  }),
  col.accessor((row) => row.name, { header: "NAME" }),
  col.accessor((row) => row.workspaceId, {
    header: "WORKSPACE",
    format: (value) => chalk.dim(value),
  }),
];

async function list(
  this: LocalContext,
  flags: ListWorksheetsFlags,
): Promise<void> {
  const format = flags.json ? ("json" as const) : flags.format;
  const { process, writer: _writer } = this;
  const writer = muteStatusWriter(_writer, {
    muted: format === "json" || format === "csv",
  });

  try {
    const config = loadConfig();
    let worksheets = await searchWorksheets(config, {
      workspaceId: flags.workspace,
      name: flags.name,
    });

    // Server-side search may return partial matches; apply the name filter
    // again client-side to mirror the Go fork.
    if (flags.name) {
      const needle = flags.name.toLowerCase();
      worksheets = worksheets.filter((w) =>
        w.name.toLowerCase().includes(needle),
      );
    }

    if (format === "json") {
      writer.write(JSON.stringify(worksheets, null, 2));
      return;
    }
    if (format === "csv") {
      writer.write(renderAsCSV(worksheets));
      return;
    }
    if (worksheets.length === 0) {
      writer.warn("No worksheets found.");
      return;
    }

    writer.write(chalk.green(`Found ${worksheets.length} worksheet(s):\n`));
    writer.write(formatTable(worksheets, columns));
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

export const listCommand = defineCommand({
  loader: async () => list,
  parameters: {
    positional: { kind: "tuple", parameters: [] },
    flags: {
      workspace: {
        kind: "parsed",
        parse: String,
        brief: "Workspace ID to list worksheets in",
        optional: false,
      },
      name: {
        kind: "parsed",
        parse: String,
        brief: "Filter worksheets by name substring",
        optional: true,
      },
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
    aliases: { w: "workspace" },
  },
  docs: { brief: "List worksheets in a workspace" },
});
