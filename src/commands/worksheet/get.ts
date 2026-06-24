import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { getWorksheet } from "../../gql/worksheet/get-worksheet";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

interface GetWorksheetFlags {
  format?: "json";
}

export interface GetWorksheetDeps {
  loadConfig?: typeof loadConfig;
  getWorksheet?: typeof getWorksheet;
}

export async function get(
  this: LocalContext,
  flags: GetWorksheetFlags,
  id: string,
  deps: GetWorksheetDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    getWorksheet: getWorksheetImpl = getWorksheet,
  } = deps;
  const { process, writer } = this;

  try {
    const config = loadConfigImpl();
    const worksheet = await getWorksheetImpl(config, { id });

    if (worksheet === null) {
      writer.error(`Error: worksheet ${id} not found`);
      process.exit(1);
      return;
    }

    writer.write(JSON.stringify(worksheet, null, 2));
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
          brief: "Worksheet ID",
          parse: String,
        },
      ],
    },
    flags: {
      format: {
        kind: "enum",
        values: ["json"],
        brief: "Output format (json)",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Get a worksheet by ID (includes stages)",
  },
});
