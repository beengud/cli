import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { deleteBoard } from "../../gql/board/board";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

export interface DeleteBoardDeps {
  loadConfig?: typeof loadConfig;
  deleteBoard?: typeof deleteBoard;
}

export async function deleteBoardCommandHandler(
  this: LocalContext,
  _flags: Record<string, never>,
  id: string,
  deps: DeleteBoardDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    deleteBoard: deleteBoardImpl = deleteBoard,
  } = deps;
  const { process, writer } = this;

  try {
    const config = loadConfigImpl();
    await deleteBoardImpl(config, { id });
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
  loader: async () => deleteBoardCommandHandler,
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
