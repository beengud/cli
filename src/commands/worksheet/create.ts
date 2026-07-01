import { defineCommand } from "../../lib/stricli-wrappers";
import * as fs from "node:fs";
import type { LocalContext } from "../../context";
import { saveWorksheet } from "../../gql/worksheet/worksheet";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

// Fields returned by the API that saveWorksheet does not accept as input.
const READ_ONLY_WORKSHEET_FIELDS = ["updatedDate"] as const;

async function create(
  this: LocalContext,
  _flags: Record<string, never>,
  file: string,
): Promise<void> {
  const { process, writer } = this;

  try {
    let input: Record<string, unknown>;
    try {
      input = JSON.parse(fs.readFileSync(file, "utf-8")) as Record<
        string,
        unknown
      >;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `worksheet: could not read or parse "${file}": ${message}`,
        { cause: error },
      );
    }

    for (const field of READ_ONLY_WORKSHEET_FIELDS) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete input[field];
    }

    const config = loadConfig();
    const worksheet = await saveWorksheet(config, input);

    writer.write(`Created: ${worksheet.name} (id: ${worksheet.id})`);
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

export const createCommand = defineCommand({
  loader: async () => create,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [{ brief: "Path to a worksheet JSON file", parse: String }],
    },
    flags: {},
  },
  docs: { brief: "Create a worksheet from a JSON file" },
});
