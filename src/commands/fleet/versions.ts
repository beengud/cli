import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { loadConfig } from "../../lib/config";
import { formatFleetError } from "./format-error";
import { muteStatusWriter } from "../../lib/writer";
import { runFleetQuery, type RunFleetQueryDeps } from "./run-query";
import { writeFleetResult, type FleetOutputFormat } from "./format-output";
import { FLEET_VERSIONS_PIPELINE } from "./pipelines";

const DEFAULT_WINDOW = "20m";

interface FleetVersionsFlags {
  window: string;
  format?: Exclude<FleetOutputFormat, "table">;
}

export interface FleetVersionsDeps extends RunFleetQueryDeps {
  loadConfig?: typeof loadConfig;
}

export async function versions(
  this: LocalContext,
  flags: FleetVersionsFlags,
  deps: FleetVersionsDeps = {},
): Promise<void> {
  const { loadConfig: loadConfigImpl = loadConfig, datasetQueryOutput } = deps;
  const format: FleetOutputFormat = flags.format ?? "table";
  const { process, writer: rawWriter } = this;
  const writer = muteStatusWriter(rawWriter, {
    muted: format !== "table",
  });

  try {
    const config = loadConfigImpl();
    writer.info("Querying fleet versions...");
    const result = await runFleetQuery(
      { config, pipeline: FLEET_VERSIONS_PIPELINE, window: flags.window },
      { datasetQueryOutput },
    );
    writeFleetResult(writer, result, format);
  } catch (error) {
    writer.error(`fleet versions failed: ${formatFleetError(error)}`);
    process.exit(1);
  }
}

export const versionsCommand = buildCommand({
  loader: async () => versions,
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
    brief: "Version distribution across the fleet",
  },
});
