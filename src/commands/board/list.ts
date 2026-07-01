import { buildCommand } from "@stricli/core";
import chalk from "chalk";
import type { LocalContext } from "../../context";
import { listBoards, type BoardListEntry } from "../../gql/board/list-boards";
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

interface ListBoardsFlags {
  workspace: string;
  format?: OutputFormat;
  json?: boolean;
}

const col = createColumnHelper<BoardListEntry>();

const columns: ColumnDef<BoardListEntry>[] = [
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
  flags: ListBoardsFlags,
  substring?: string,
): Promise<void> {
  const format = flags.json ? ("json" as const) : flags.format;
  const { process, writer: _writer } = this;
  const writer = muteStatusWriter(_writer, {
    muted: format === "json" || format === "csv",
  });

  try {
    const config = loadConfig();

    let boards = await listBoards(config, flags.workspace);
    if (substring) {
      const needle = substring.toLowerCase();
      boards = boards.filter((b) => b.name.toLowerCase().includes(needle));
    }

    if (format === "json") {
      writer.write(JSON.stringify(boards, null, 2));
      return;
    }

    if (format === "csv") {
      writer.write(renderAsCSV(boards));
      return;
    }

    if (boards.length === 0) {
      writer.warn("No boards found.");
      return;
    }

    writer.write(chalk.green(`Found ${boards.length} board(s):\n`));
    writer.write(formatTable(boards, columns));
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
          brief: "Filter boards by name substring (optional)",
          parse: String,
          optional: true,
        },
      ],
    },
    flags: {
      workspace: {
        kind: "parsed",
        parse: String,
        brief: "Workspace ID to list boards in",
        optional: false,
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
    aliases: {
      w: "workspace",
    },
  },
  docs: {
    brief: "List boards (dashboards) in a workspace",
  },
});
