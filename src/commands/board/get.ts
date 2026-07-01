import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { getBoard } from "../../gql/board/get-board";
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
    const board = await getBoard(config, id);

    if (board === null) {
      writer.error(`Error: board not found: ${id}`);
      process.exit(1);
      return;
    }

    writer.write(JSON.stringify(board, null, 2));
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
          brief: "Board (dashboard) ID",
          parse: String,
        },
      ],
    },
    flags: {},
  },
  docs: {
    brief: "Get a board (dashboard) by ID as JSON",
  },
});
