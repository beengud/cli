import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { verbsAndFunctions } from "../../gql/opal/verbs-and-functions";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";
import { renderAsCSV } from "../../lib/formatters/csv";

type OutputFormat = "json" | "csv";

interface FunctionsFlags {
  format?: OutputFormat;
}

export interface FunctionsDeps {
  loadConfig?: typeof loadConfig;
  verbsAndFunctions?: typeof verbsAndFunctions;
}

export async function functions(
  this: LocalContext,
  flags: FunctionsFlags,
  deps: FunctionsDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    verbsAndFunctions: verbsAndFunctionsImpl = verbsAndFunctions,
  } = deps;
  const { process, writer } = this;

  try {
    const config = loadConfigImpl();
    const result = await verbsAndFunctionsImpl(config);

    const rows = [...result.functions]
      .map((f) => ({
        name: f.name ?? "",
        categories: (f.categories ?? []).join(","),
        returnType: f.returnType ?? "",
        description: f.description ?? "",
      }))
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    if (flags.format === "json") {
      writer.write(JSON.stringify(rows, null, 2));
      return;
    }
    if (flags.format === "csv") {
      writer.write(renderAsCSV(rows));
      return;
    }

    for (const f of rows) {
      writer.write(
        `${f.name}\t${f.categories}\t${f.returnType}\t${f.description}`,
      );
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

export const functionsCommand = buildCommand({
  loader: async () => functions,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [],
    },
    flags: {
      format: {
        kind: "enum",
        values: ["json", "csv"],
        brief: "Output format (json, csv) (default: TSV)",
        optional: true,
      },
    },
  },
  docs: {
    brief: "List all OPAL functions",
    fullDescription: [
      "List all OPAL functions sorted by name.",
      "",
      "Default output is tab-separated: name, categories, return type, description.",
    ].join("\n"),
  },
});
