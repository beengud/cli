import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { deleteWorksheet } from "../../gql/worksheet/worksheet";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

async function del(
  this: LocalContext,
  _flags: Record<string, never>,
  id: string,
): Promise<void> {
  const { process, writer } = this;

  try {
    const config = loadConfig();
    const result = await deleteWorksheet(config, id);

    // Only treat as failure when `success` is explicitly false; the API may
    // populate `errorMessage` with a success notice.
    if (result.success === false) {
      writer.error(
        `Error: worksheet delete: ${result.errorMessage ?? "failed"}`,
      );
      process.exit(1);
      return;
    }

    writer.write(`Deleted worksheet ${id}`);
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

export const deleteCommand = buildCommand({
  loader: async () => del,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [{ brief: "Worksheet ID to delete", parse: String }],
    },
    flags: {},
  },
  docs: { brief: "Delete a worksheet by ID" },
});
