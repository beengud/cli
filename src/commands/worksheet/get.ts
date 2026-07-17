import { defineCommand } from "../../lib/stricli-wrappers";
import type { LocalContext } from "../../context";
import { getWorksheet } from "../../gql/worksheet/worksheet";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

async function get(
  this: LocalContext,
  _flags: Record<string, never>,
  id: string,
): Promise<void> {
  const { process, writer } = this;

  try {
    const config = loadConfig();
    const worksheet = await getWorksheet(config, id);

    if (worksheet === null) {
      writer.error(`Error: worksheet not found: ${id}`);
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

export const getCommand = defineCommand({
  loader: async () => get,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [{ brief: "Worksheet ID", parse: String }],
    },
    flags: {},
  },
  docs: { brief: "Get a worksheet by ID as JSON" },
});
