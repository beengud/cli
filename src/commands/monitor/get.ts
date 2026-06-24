import { buildCommand } from "@stricli/core";
import chalk from "chalk";
import type { LocalContext } from "../../context";
import { getMonitor, type GqlMonitor } from "../../gql/monitor/get-monitor";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";
import { muteStatusWriter } from "../../lib/writer";
import { renderObject } from "../../lib/formatters/object";
import { renderAsCSV } from "../../lib/formatters/csv";
import { timeToDisplay } from "./format";

type OutputFormat = "json" | "csv";

interface GetMonitorFlags {
  format?: OutputFormat;
  json?: boolean;
}

export interface GetMonitorDeps {
  loadConfig?: typeof loadConfig;
  getMonitor?: typeof getMonitor;
}

interface Column {
  columnPath?: { name: string; path?: string | null } | null;
  linkColumn?: { name: string } | null;
}

function columnName(column: Column): string {
  return column.columnPath?.name ?? column.linkColumn?.name ?? "?";
}

/** Build a flattened, human-readable view of a monitor for default output. */
function buildViewData(monitor: GqlMonitor) {
  const def = monitor.definition;
  return {
    id: monitor.id,
    name: monitor.name,
    description: monitor.description ?? "-",
    disabled: monitor.disabled ?? false,
    ruleKind: monitor.ruleKind,
    workspaceId: monitor.workspaceId,
    createdDate: timeToDisplay(monitor.createdDate),
    updatedDate: timeToDisplay(monitor.updatedDate),
    lookbackTime: def.lookbackTime ?? "-",
    dataStabilizationDelay: def.dataStabilizationDelay ?? "-",
    maxAlertsPerHour: def.maxAlertsPerHour ?? "-",
    groupings: (def.groupings ?? []).map(columnName).join(", ") || "-",
    rules: def.rules.map((rule) => ({
      level: rule.level,
      kind: rule.count
        ? "count"
        : rule.threshold
          ? "threshold"
          : rule.promote
            ? "promote"
            : rule.anomaly
              ? "anomaly"
              : "-",
    })),
  };
}

export async function get(
  this: LocalContext,
  flags: GetMonitorFlags,
  id: string,
  deps: GetMonitorDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    getMonitor: getMonitorImpl = getMonitor,
  } = deps;
  const format = flags.json ? ("json" as const) : flags.format;
  const { process, writer: _writer } = this;
  const writer = muteStatusWriter(_writer, {
    muted: format === "json" || format === "csv",
  });

  try {
    const config = loadConfigImpl();

    writer.info("Fetching monitor...");

    const monitor = await getMonitorImpl(config, id);

    if (format === "json") {
      writer.write(JSON.stringify(monitor, null, 2));
      return;
    }

    if (format === "csv") {
      writer.write(renderAsCSV(monitor));
      return;
    }

    writer.write("");
    writer.write(chalk.bold.white(`Monitor ${monitor.id}`));
    renderObject(buildViewData(monitor), (text) => writer.write(text));
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

export const getCommand = buildCommand({
  loader: async () => get,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Monitor ID",
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
    aliases: {},
  },
  docs: {
    brief: "Get a Monitor V2 by ID (includes its definition)",
  },
});
