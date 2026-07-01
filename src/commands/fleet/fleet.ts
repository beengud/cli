import { defineCommand } from "../../lib/stricli-wrappers";
import type { LocalContext } from "../../context";
import { loadConfig } from "../../lib/config";
import { formatApiError } from "../../lib/format-error";
import { parseDurationMs } from "../../lib/parsers";
import { runOpalQueryCsv } from "../../rest/export/run-opal-query";

// The dataset and OPAL pipelines below are ported verbatim from the Go fork
// (cmd_fleet.go). They read observe-agent AgentLifecycleEvent rows from the
// fleet events dataset.
const FLEET_DATASET = "Default.Observe Agent/Events";

const OPAL_FLEET_STATUS =
  'filter kind = "AgentLifecycleEvent" | make_col host:string(identifiers["host.name"]), env:string(identifiers["observe.agent.environment"]), version:string(facets["observe.agent.version"]), instance_id:string(identifiers["observe.agent.instance.id"]), data_obj:parse_json(data) | make_col auth_ok:bool(data_obj.authCheck.passed) | pick_col valid_from, host, env, version, auth_ok, instance_id | sort desc(valid_from)';

const OPAL_FLEET_VERSIONS =
  'filter kind = "AgentLifecycleEvent" | make_col host:string(identifiers["host.name"]), env:string(identifiers["observe.agent.environment"]), version:string(facets["observe.agent.version"]) | pick_col valid_from, host, env, version | sort asc(version), asc(host)';

const OPAL_FLEET_AUTH =
  'filter kind = "AgentLifecycleEvent" | make_col host:string(identifiers["host.name"]), env:string(identifiers["observe.agent.environment"]), version:string(facets["observe.agent.version"]), data_obj:parse_json(data) | make_col auth_ok:bool(data_obj.authCheck.passed), auth_code:int64(data_obj.authCheck.responseCode), auth_url:string(data_obj.authCheck.url) | pick_col valid_from, host, env, version, auth_ok, auth_code, auth_url | sort asc(auth_ok), desc(valid_from)';

function opalFleetHost(hostname: string): string {
  // Embed the hostname as a quoted OPAL string literal.
  const quoted = JSON.stringify(hostname);
  return `filter kind = "AgentLifecycleEvent" | filter string(identifiers["host.name"]) = ${quoted} | make_col host:string(identifiers["host.name"]), env:string(identifiers["observe.agent.environment"]), version:string(facets["observe.agent.version"]), data_obj:parse_json(data) | make_col auth_ok:bool(data_obj.authCheck.passed), start_time:from_nanoseconds(int64(data_obj.agentStartTime)*1000000000) | pick_col valid_from, host, env, version, auth_ok, start_time | sort desc(valid_from)`;
}

const DEFAULT_WINDOW_MS = 20 * 60 * 1000;

// The --window flag accepts a Go-style duration; parsing lives in lib/parsers.
// Re-exported as parseWindow for tests.
export const parseWindow = parseDurationMs;

interface FleetFlags {
  window: number;
}

// Compute the [from, to) window the same way the Go fork does: anchor `to` 15s
// before now, truncated to the minute, and `from` one window earlier.
function timeWindow(windowMs: number): { startTime: string; endTime: string } {
  const nowMs = Math.floor(Date.now() / 1000) * 1000;
  const toMs = Math.floor((nowMs - 15_000) / 60_000) * 60_000;
  const fromMs = toMs - windowMs;
  return {
    startTime: new Date(fromMs).toISOString(),
    endTime: new Date(toMs).toISOString(),
  };
}

async function runFleet(
  this: LocalContext,
  flags: FleetFlags,
  pipeline: string,
): Promise<void> {
  const { process, writer } = this;
  try {
    const config = loadConfig();
    const { startTime, endTime } = timeWindow(
      flags.window || DEFAULT_WINDOW_MS,
    );
    const csv = await runOpalQueryCsv(config, {
      pipeline,
      datasetPath: FLEET_DATASET,
      startTime,
      endTime,
    });
    // The export endpoint already returns CSV; emit it as-is (trim a single
    // trailing newline so the writer's own newline doesn't double it).
    writer.write(csv.replace(/\n$/, ""));
  } catch (error) {
    writer.error(`Error: ${await formatApiError(error)}`);
    process.exit(1);
  }
}

const windowFlag = {
  window: {
    kind: "parsed" as const,
    parse: parseWindow,
    brief: "Time window for the query (e.g. 20m, 24h, 168h)",
    default: "20m",
  },
};

export const statusCommand = defineCommand({
  loader: async () => {
    return async function (this: LocalContext, flags: FleetFlags) {
      await runFleet.call(this, flags, OPAL_FLEET_STATUS);
    };
  },
  parameters: {
    positional: { kind: "tuple", parameters: [] },
    flags: windowFlag,
  },
  docs: { brief: "Show current status of all observe-agent instances" },
});

export const versionsCommand = defineCommand({
  loader: async () => {
    return async function (this: LocalContext, flags: FleetFlags) {
      await runFleet.call(this, flags, OPAL_FLEET_VERSIONS);
    };
  },
  parameters: {
    positional: { kind: "tuple", parameters: [] },
    flags: windowFlag,
  },
  docs: { brief: "Show observe-agent versions across the fleet" },
});

export const authCommand = defineCommand({
  loader: async () => {
    return async function (this: LocalContext, flags: FleetFlags) {
      await runFleet.call(this, flags, OPAL_FLEET_AUTH);
    };
  },
  parameters: {
    positional: { kind: "tuple", parameters: [] },
    flags: windowFlag,
  },
  docs: { brief: "Show observe-agent auth-check status across the fleet" },
});

export const hostCommand = defineCommand({
  loader: async () => {
    return async function (
      this: LocalContext,
      flags: FleetFlags,
      hostname: string,
    ) {
      await runFleet.call(this, flags, opalFleetHost(hostname));
    };
  },
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [{ brief: "Agent host name", parse: String }],
    },
    flags: windowFlag,
  },
  docs: { brief: "Show observe-agent details for a single host" },
});
