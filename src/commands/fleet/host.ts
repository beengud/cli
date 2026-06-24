import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { loadConfig } from "../../lib/config";
import { formatFleetError } from "./format-error";
import { muteStatusWriter } from "../../lib/writer";
import { runFleetQuery, type RunFleetQueryDeps } from "./run-query";
import { writeFleetResult, type FleetOutputFormat } from "./format-output";
import { fleetHostPipeline } from "./pipelines";

const DEFAULT_WINDOW = "20m";

interface FleetHostFlags {
  window: string;
  format?: Exclude<FleetOutputFormat, "table">;
}

export interface FleetHostDeps extends RunFleetQueryDeps {
  loadConfig?: typeof loadConfig;
}

export async function host(
  this: LocalContext,
  flags: FleetHostFlags,
  hostname: string,
  deps: FleetHostDeps = {},
): Promise<void> {
  const { loadConfig: loadConfigImpl = loadConfig, datasetQueryOutput } = deps;
  const format: FleetOutputFormat = flags.format ?? "table";
  const { process, writer: rawWriter } = this;
  const writer = muteStatusWriter(rawWriter, {
    muted: format !== "table",
  });

  try {
    const config = loadConfigImpl();
    writer.info(`Querying fleet history for host ${hostname}...`);
    const result = await runFleetQuery(
      { config, pipeline: fleetHostPipeline(hostname), window: flags.window },
      { datasetQueryOutput },
    );
    writeFleetResult(writer, result, format);
  } catch (error) {
    writer.error(`fleet host failed: ${formatFleetError(error)}`);
    process.exit(1);
  }
}

export const hostCommand = buildCommand({
  loader: async () => host,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Hostname (identifiers[\"host.name\"]) to show event history for",
          parse: String,
        },
      ],
    },
    flags: {
      window: {
        kind: "parsed",
        parse: String,
        brief: "Time window for the query (Go duration, e.g. 20m, 24h, 168h)",
        default: DEFAULT_WINDOW,
      },
      format: {
        kind: "enum",
        values: ["json", "csv"],
        brief: "Output format (json, csv) (default: table)",
        optional: true,
      },
    },
    aliases: { w: "window" },
  },
  docs: {
    brief: "Event history for one host, including agent start time",
  },
});
