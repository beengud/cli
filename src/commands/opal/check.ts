import { defineCommand } from "../../lib/stricli-wrappers";
import * as fs from "node:fs";
import type { LocalContext } from "../../context";
import { checkQueries } from "../../gql/opal/check-queries";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

interface CheckFlags {
  file?: string;
}

async function check(
  this: LocalContext,
  flags: CheckFlags,
  pipelineArg?: string,
): Promise<void> {
  const { process, writer } = this;

  try {
    let pipeline: string;
    if (flags.file) {
      try {
        pipeline = fs.readFileSync(flags.file, "utf-8");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
          `opal check: could not read file "${flags.file}": ${message}`,
          { cause: error },
        );
      }
    } else if (pipelineArg) {
      pipeline = pipelineArg;
    } else {
      writer.error(
        "Error: usage: observe opal check <pipeline> | observe opal check --file <path>",
      );
      process.exit(1);
      return;
    }

    const config = loadConfig();
    const result = await checkQueries(config, {
      queries: {
        outputStage: "stage-1",
        // StageQueryInput uses `id` (the deprecated `stageID` alias is not in
        // the generated input type). The outputStage references this id.
        stages: [{ id: "stage-1", pipeline, input: [] }],
      },
    });

    const parsed = result?.parsedPipeline;

    // Errors with empty text indicate "compilation requires an input dataset"
    // and are not real syntax errors; skip them. (Matches the Go fork.)
    const errors = (parsed?.errors ?? []).filter((e) => e.text !== "");
    const warnings = parsed?.warnings ?? [];

    if (errors.length > 0) {
      for (const e of errors) {
        writer.write(`ERROR ${e.row}:${e.col}: ${e.text}`);
      }
      writer.error("Error: opal check: pipeline has errors");
      process.exit(1);
      return;
    }

    for (const w of warnings) {
      writer.write(`WARN ${w.kind ?? ""} ${w.symbol.row}:${w.symbol.col}`);
    }

    writer.write("OK");
    for (const f of result?.resultSchema?.fieldList ?? []) {
      writer.write(`  ${f.name ?? ""}`);
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

export const checkCommand = defineCommand({
  loader: async () => check,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "OPAL pipeline text (or use --file)",
          parse: String,
          optional: true,
        },
      ],
    },
    flags: {
      file: {
        kind: "parsed",
        parse: String,
        brief: "Read the OPAL pipeline from a file instead of the argument",
        optional: true,
      },
    },
    aliases: {
      f: "file",
    },
  },
  docs: {
    brief: "Validate an OPAL pipeline and print its result schema",
  },
});
