import { buildCommand } from "@stricli/core";
import chalk from "chalk";
import type { LocalContext } from "../../context";
import {
  searchMonitors,
  type GqlMonitorSummary,
} from "../../gql/monitor/search-monitors";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";
import { muteStatusWriter } from "../../lib/writer";
import {
  formatTable,
  createColumnHelper,
  type ColumnDef,
} from "../../lib/formatters/table";
import { renderAsCSV } from "../../lib/formatters/csv";
import { timeToDisplay } from "./format";

type OutputFormat = "json" | "csv";

interface ListMonitorsFlags {
  workspace?: string;
  format?: OutputFormat;
  json?: boolean;
}

export interface ListMonitorsDeps {
  loadConfig?: typeof loadConfig;
  searchMonitors?: typeof searchMonitors;
}

const col = createColumnHelper<GqlMonitorSummary>();

const COLUMNS: ColumnDef<GqlMonitorSummary>[] = [
  col.accessor((row) => row.id, {
    header: "ID",
    format: (value) => chalk.cyan(value),
  }),
  col.accessor((row) => row.name, {
    header: "NAME",
    flex: true,
  }),
  col.accessor((row) => row.disabled ?? false, {
    header: "DISABLED",
    format: (value) => (value ? chalk.yellow("Yes") : chalk.dim("No")),
  }),
  col.accessor((row) => row.updatedDate, {
    header: "UPDATED",
    format: (value) => timeToDisplay(value),
  }),
];

export async function list(
  this: LocalContext,
  flags: ListMonitorsFlags,
  nameSubstring: string | undefined,
  deps: ListMonitorsDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    searchMonitors: searchMonitorsImpl = searchMonitors,
  } = deps;
  const format = flags.json ? ("json" as const) : flags.format;
  const { process, writer: _writer } = this;
  const writer = muteStatusWriter(_writer, {
    muted: format === "json" || format === "csv",
  });

  try {
    const config = loadConfigImpl();

    writer.info("Searching monitors...");

    const monitors = await searchMonitorsImpl(config, {
      workspaceId: flags.workspace,
      nameSubstring,
    });

    if (format === "json") {
      writer.write(JSON.stringify(monitors, null, 2));
      return;
    }

    if (format === "csv") {
      writer.write(renderAsCSV(monitors));
      return;
    }

    if (monitors.length === 0) {
      writer.warn("No monitors found.");
      return;
    }

    writer.write(chalk.green(`Found ${monitors.length} monitor(s):\n`));
    writer.write(formatTable(monitors, COLUMNS));
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
      parameters: [
        {
          brief: "Filter monitors by name substring (case-insensitive)",
          parse: String,
          optional: true,
        },
      ],
    },
    flags: {
      workspace: {
        kind: "parsed",
        parse: String,
        brief: "Workspace ID to scope the search",
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
    aliases: {},
  },
  docs: {
    brief: "List Monitor V2 resources",
  },
});
