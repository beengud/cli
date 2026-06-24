import { buildCommand } from "@stricli/core";
import { readFileSync } from "node:fs";
import type { LocalContext } from "../../context";
import { checkQueries } from "../../gql/opal/check-queries";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

interface CheckFlags {
  file?: string;
}

export interface CheckDeps {
  loadConfig?: typeof loadConfig;
  checkQueries?: typeof checkQueries;
  readFile?: (path: string) => string;
}

export async function check(
  this: LocalContext,
  flags: CheckFlags,
  pipelineArg: string | undefined,
  deps: CheckDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    checkQueries: checkQueriesImpl = checkQueries,
    readFile: readFileImpl = (path: string) => readFileSync(path, "utf8"),
  } = deps;
  const { process, writer } = this;

  try {
    let pipeline: string;
    if (flags.file) {
      try {
        pipeline = readFileImpl(flags.file);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        writer.error(
          `opal check: could not read file "${flags.file}": ${message}`,
        );
        process.exit(1);
        return;
      }
    } else if (pipelineArg !== undefined) {
      pipeline = pipelineArg;
    } else {
      writer.error(
        "usage: observe opal check <pipeline> | observe opal check --file <path>",
      );
      process.exit(1);
      return;
    }

    const config = loadConfigImpl();
    const result = await checkQueriesImpl(config, {
      queries: {
        outputStage: "stage-1",
        stages: [
          {
            id: "stage-1",
            pipeline,
            input: [],
          },
        ],
      },
    });

    const parsed = result?.parsedPipeline;

    // Errors with empty text mean "compilation requires an input dataset" and
    // are not real syntax errors in the pipeline itself — suppress them.
    const errors = (parsed?.errors ?? []).filter((e) => (e.text ?? "") !== "");
    const warnings = parsed?.warnings ?? [];

    if (errors.length > 0) {
      for (const e of errors) {
        writer.write(`ERROR ${e.row}:${e.col}: ${e.text}`);
      }
      process.exit(1);
      return;
    }

    for (const w of warnings) {
      writer.write(`WARN ${w.kind} ${w.symbol?.row}:${w.symbol?.col}`);
    }

    writer.write("OK");
    for (const field of result?.resultSchema?.fieldList ?? []) {
      writer.write(`  ${field.name}`);
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

export const checkCommand = buildCommand({
  loader: async () => check,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "OPAL pipeline to validate (omit when using --file)",
          parse: String,
          optional: true,
        },
      ],
    },
    flags: {
      file: {
        kind: "parsed",
        parse: String,
        brief: "Read OPAL pipeline from file instead of argument",
        optional: true,
      },
    },
    aliases: {
      f: "file",
    },
  },
  docs: {
    brief: "Validate an OPAL pipeline",
    fullDescription: [
      "Validate an OPAL pipeline via the checkQueries API.",
      "",
      "On error, prints each as 'ERROR row:col: message' and exits 1.",
      "On warnings only, prints 'WARN kind row:col' and exits 0.",
      "On success, prints 'OK' followed by the result schema field names.",
      "",
      "Examples:",
      "  observe opal check 'filter true'",
      "  observe opal check --file ./pipeline.opal",
    ].join("\n"),
  },
});
