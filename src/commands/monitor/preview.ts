import { buildCommand } from "@stricli/core";
import chalk from "chalk";
import type { LocalContext } from "../../context";
import {
  previewMonitor,
  type GqlMonitorPreview,
} from "../../gql/monitor/preview-monitor";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";
import { muteStatusWriter } from "../../lib/writer";
import { parseDurationMs } from "./duration";
import { readMonitorInput } from "./read-input";
import { timeToDisplay } from "./format";

type OutputFormat = "json" | "csv";

interface PreviewFlags {
  workspace?: string;
  since: number;
  format?: OutputFormat;
  json?: boolean;
}

export interface PreviewDeps {
  loadConfig?: typeof loadConfig;
  previewMonitor?: typeof previewMonitor;
  readMonitorInput?: typeof readMonitorInput;
  now?: () => Date;
}

interface Column {
  columnPath?: { name: string; path?: string | null } | null;
  linkColumn?: { name: string } | null;
}

function columnName(column: Column): string {
  return column.columnPath?.name ?? column.linkColumn?.name ?? "?";
}

/** Render the grouping context for a single previewed alarm as `k=v` pairs. */
function describeGroupings(alarm: GqlMonitorPreview["alarms"][number]): string {
  const entries =
    alarm.context.length > 0 ? alarm.context : alarm.capturedValues;
  return entries
    .map((entry) => `${columnName(entry.column)}=${entry.value ?? ""}`)
    .join(" ");
}

export async function preview(
  this: LocalContext,
  flags: PreviewFlags,
  file: string,
  deps: PreviewDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    previewMonitor: previewImpl = previewMonitor,
    readMonitorInput: readInputImpl = readMonitorInput,
    now = () => new Date(),
  } = deps;
  const format = flags.json ? ("json" as const) : flags.format;
  const { process, writer: _writer } = this;
  const writer = muteStatusWriter(_writer, {
    muted: format === "json" || format === "csv",
  });

  try {
    const config = loadConfigImpl();
    const input = readInputImpl(file);

    const end = now();
    const start = new Date(end.getTime() - flags.since);
    const params = {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    };

    writer.info("Previewing monitor...");

    const result = await previewImpl(config, input, params, flags.workspace);

    if (format === "json") {
      writer.write(JSON.stringify(result, null, 2));
      return;
    }

    if (format === "csv") {
      writer.write(
        result.alarms
          .map((a) => ({
            id: a.id,
            level: a.level,
            start: timeToDisplay(a.start, ""),
            end: timeToDisplay(a.end, ""),
            groupings: describeGroupings(a),
          }))
          .map(
            (r) =>
              `${r.id},${r.level},${r.start},${r.end},${JSON.stringify(r.groupings)}`,
          )
          .join("\n") + "\n",
      );
      return;
    }

    const wouldFire = result.alarms.length > 0;
    writer.write(
      `Would fire: ${wouldFire ? chalk.green("true") : chalk.dim("false")}`,
    );

    if (result.alarms.length > 0) {
      writer.write("");
      writer.write(chalk.bold("Sample alarm groupings:"));
      for (const alarm of result.alarms) {
        const groupings = describeGroupings(alarm);
        writer.write(
          `  level=${alarm.level} start=${timeToDisplay(alarm.start)}` +
            (groupings ? ` ${groupings}` : ""),
        );
      }
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

const DEFAULT_SINCE = "1h";

export const previewCommand = buildCommand({
  loader: async () => preview,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Path to a MonitorV2Input JSON file",
          parse: String,
        },
      ],
    },
    flags: {
      workspace: {
        kind: "parsed",
        parse: String,
        brief: "Workspace ID to scope the preview",
        optional: true,
      },
      since: {
        kind: "parsed",
        parse: parseDurationMs,
        brief: "Lookback window for the preview (e.g. 1h, 24h, 7d)",
        default: DEFAULT_SINCE,
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
    brief: "Preview whether a monitor would fire against recent data",
  },
});
