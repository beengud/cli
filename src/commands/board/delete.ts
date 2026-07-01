import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { deleteBoard } from "../../gql/board/delete-board";
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
    const result = await deleteBoard(config, id);

    // The API reports success via `success: true` and may populate
    // `errorMessage` with a success notice, so only treat it as a failure
    // when `success` is explicitly false.
    if (result.success === false) {
      writer.error(`Error: board delete: ${result.errorMessage ?? "failed"}`);
      process.exit(1);
      return;
    }

    writer.write(`Deleted board ${id}`);
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
      parameters: [
        {
          brief: "Board (dashboard) ID to delete",
          parse: String,
        },
      ],
    },
    flags: {},
  },
  docs: {
    brief: "Delete a board (dashboard) by ID",
  },
});
