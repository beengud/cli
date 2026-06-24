import { buildCommand } from "@stricli/core";
import chalk from "chalk";
import type { LocalContext } from "../../context";
import {
  searchMonitorAlarms,
  type GqlMonitorAlarm,
} from "../../gql/monitor/search-alarms";
import {
  type MonitorV2AlarmLevel,
  MonitorV2AlarmLevel as AlarmLevel,
} from "../../gql/generated/graphql";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";
import { muteStatusWriter } from "../../lib/writer";
import {
  formatTable,
  createColumnHelper,
  type ColumnDef,
} from "../../lib/formatters/table";
import { renderAsCSV } from "../../lib/formatters/csv";
import { parseDurationMs } from "./duration";
import { timeToDisplay } from "./format";

type OutputFormat = "json" | "csv";

interface AlarmsFlags {
  workspace?: string;
  monitorId?: string;
  since: number;
  level?: MonitorV2AlarmLevel;
  format?: OutputFormat;
  json?: boolean;
}

export interface AlarmsDeps {
  loadConfig?: typeof loadConfig;
  searchMonitorAlarms?: typeof searchMonitorAlarms;
  now?: () => Date;
}

/** searchMonitorV2Alarms has no `status`; derive it from the `isActive` flag. */
function alarmStatus(alarm: GqlMonitorAlarm): string {
  return alarm.isActive ? "Active" : "Ended";
}

const col = createColumnHelper<GqlMonitorAlarm>();

const COLUMNS: ColumnDef<GqlMonitorAlarm>[] = [
  col.accessor((row) => row.id, { header: "ID", format: (v) => chalk.cyan(v) }),
  col.accessor((row) => row.monitor?.id ?? "-", { header: "MONITOR ID" }),
  col.accessor((row) => row.level, { header: "LEVEL" }),
  col.accessor((row) => row, {
    header: "STATUS",
    format: (_v, row) => {
      const status = alarmStatus(row);
      return status === "Active" ? chalk.green(status) : chalk.dim(status);
    },
  }),
  col.accessor((row) => timeToDisplay(row.start), { header: "START" }),
  col.accessor((row) => timeToDisplay(row.end), { header: "END" }),
];

export async function alarms(
  this: LocalContext,
  flags: AlarmsFlags,
  deps: AlarmsDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    searchMonitorAlarms: searchImpl = searchMonitorAlarms,
    now = () => new Date(),
  } = deps;
  const format = flags.json ? ("json" as const) : flags.format;
  const { process, writer: _writer } = this;
  const writer = muteStatusWriter(_writer, {
    muted: format === "json" || format === "csv",
  });

  try {
    const config = loadConfigImpl();

    const minTime =
      flags.since > 0
        ? new Date(now().getTime() - flags.since).toISOString()
        : undefined;

    writer.info("Searching alarms...");

    const result = await searchImpl(config, {
      workspaceId: flags.workspace,
      monitorIds: flags.monitorId ? [flags.monitorId] : undefined,
      minTime,
      levels: flags.level ? [flags.level] : undefined,
    });

    // Project the search result into the brief's flat column contract so JSON
    // and CSV consumers see `monitorId`/`status`/`startTime`/`endTime` even
    // though the underlying type nests/derives them.
    const rows = result.map((a) => ({
      id: a.id,
      monitorId: a.monitor?.id ?? null,
      level: a.level,
      status: alarmStatus(a),
      startTime: a.start,
      endTime: a.end,
    }));

    if (format === "json") {
      writer.write(JSON.stringify(rows, null, 2));
      return;
    }

    if (format === "csv") {
      writer.write(renderAsCSV(rows));
      return;
    }

    if (result.length === 0) {
      writer.warn("No alarms found.");
      return;
    }

    writer.write(chalk.green(`Found ${result.length} alarm(s):\n`));
    writer.write(formatTable(result, COLUMNS));
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

const LEVEL_BY_INPUT: Record<string, MonitorV2AlarmLevel> = {
  critical: AlarmLevel.Critical,
  error: AlarmLevel.Error,
  warning: AlarmLevel.Warning,
  informational: AlarmLevel.Informational,
};

function parseLevel(value: string): MonitorV2AlarmLevel {
  const level = LEVEL_BY_INPUT[value.toLowerCase()];
  if (!level) {
    throw new Error(
      `Invalid level "${value}". Expected one of: ${Object.keys(LEVEL_BY_INPUT).join(", ")}`,
    );
  }
  return level;
}

const DEFAULT_SINCE = "24h";

export const alarmsCommand = buildCommand({
  loader: async () => alarms,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [],
    },
    flags: {
      workspace: {
        kind: "parsed",
        parse: String,
        brief: "Workspace ID to scope the search",
        optional: true,
      },
      monitorId: {
        kind: "parsed",
        parse: String,
        brief: "Monitor ID to filter alarms",
        optional: true,
      },
      since: {
        kind: "parsed",
        parse: parseDurationMs,
        brief: "Duration to look back for alarms (e.g. 24h, 7d)",
        default: DEFAULT_SINCE,
      },
      level: {
        kind: "parsed",
        parse: parseLevel,
        brief: "Alarm level filter: critical|error|warning|informational",
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
    brief: "Search Monitor V2 alarms",
  },
});
