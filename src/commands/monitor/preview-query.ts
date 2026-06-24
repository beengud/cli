import { buildCommand } from "@stricli/core";
import chalk from "chalk";
import type { LocalContext } from "../../context";
import {
  evaluateMonitorSource,
  type GqlSourceEvaluation,
} from "../../gql/monitor/evaluate-source";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";
import { muteStatusWriter } from "../../lib/writer";
import { readMonitorInput } from "./read-input";

type OutputFormat = "json" | "csv";

interface PreviewQueryFlags {
  format?: OutputFormat;
  json?: boolean;
}

export interface PreviewQueryDeps {
  loadConfig?: typeof loadConfig;
  evaluateMonitorSource?: typeof evaluateMonitorSource;
  readMonitorInput?: typeof readMonitorInput;
}

/** Join the per-stage OPAL pipelines into a single readable program. */
function renderPipeline(evaluation: GqlSourceEvaluation): string {
  return evaluation.query.stages
    .map((stage) => `// stage ${stage.id}\n${stage.pipeline}`)
    .join("\n\n");
}

export async function previewQuery(
  this: LocalContext,
  flags: PreviewQueryFlags,
  file: string,
  deps: PreviewQueryDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    evaluateMonitorSource: evaluateImpl = evaluateMonitorSource,
    readMonitorInput: readInputImpl = readMonitorInput,
  } = deps;
  const format = flags.json ? ("json" as const) : flags.format;
  const { process, writer: _writer } = this;
  const writer = muteStatusWriter(_writer, {
    muted: format === "json" || format === "csv",
  });

  try {
    const config = loadConfigImpl();
    const input = readInputImpl(file);

    writer.info("Evaluating monitor source...");

    const evaluation = await evaluateImpl(config, input);

    if (format === "json") {
      writer.write(JSON.stringify(evaluation, null, 2));
      return;
    }

    if (format === "csv") {
      writer.write(
        evaluation.query.stages
          .map((stage) => ({ stage: stage.id, pipeline: stage.pipeline }))
          .map((row) => `${row.stage},${JSON.stringify(row.pipeline)}`)
          .join("\n") + "\n",
      );
      return;
    }

    writer.write(chalk.bold(`Output stage: ${evaluation.query.outputStage}`));
    writer.write("");
    writer.write(chalk.bold("Pipeline:"));
    writer.write(renderPipeline(evaluation));
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

export const previewQueryCommand = buildCommand({
  loader: async () => previewQuery,
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
    brief: "Compile a monitor input into its OPAL pipeline + result schema",
  },
});
