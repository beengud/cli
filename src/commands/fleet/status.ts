import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { loadConfig } from "../../lib/config";
import { formatFleetError } from "./format-error";
import { muteStatusWriter } from "../../lib/writer";
import { runFleetQuery, type RunFleetQueryDeps } from "./run-query";
import { writeFleetResult, type FleetOutputFormat } from "./format-output";
import { FLEET_STATUS_PIPELINE } from "./pipelines";

const DEFAULT_WINDOW = "20m";

interface FleetStatusFlags {
  window: string;
  format?: Exclude<FleetOutputFormat, "table">;
}

export interface FleetStatusDeps extends RunFleetQueryDeps {
  loadConfig?: typeof loadConfig;
}

export async function status(
  this: LocalContext,
  flags: FleetStatusFlags,
  deps: FleetStatusDeps = {},
): Promise<void> {
  const { loadConfig: loadConfigImpl = loadConfig, datasetQueryOutput } = deps;
  const format: FleetOutputFormat = flags.format ?? "table";
  const { process, writer: rawWriter } = this;
  const writer = muteStatusWriter(rawWriter, {
    muted: format !== "table",
  });

  try {
    const config = loadConfigImpl();
    writer.info("Querying fleet status...");
    const result = await runFleetQuery(
      { config, pipeline: FLEET_STATUS_PIPELINE, window: flags.window },
      { datasetQueryOutput },
    );
    writeFleetResult(writer, result, format);
  } catch (error) {
    writer.error(`fleet status failed: ${formatFleetError(error)}`);
    process.exit(1);
  }
}

export const statusCommand = buildCommand({
  loader: async () => status,
  parameters: {
    positional: { kind: "tuple", parameters: [] },
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
    brief: "Current agent inventory (host, env, version, auth, instance id)",
  },
});
