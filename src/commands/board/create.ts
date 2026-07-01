import { defineCommand } from "../../lib/stricli-wrappers";
import type { LocalContext } from "../../context";
import { saveBoard } from "../../gql/board/save-board";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";
import { readBoardInput } from "./read-input";
import { boardViewURL } from "./view-url";

async function create(
  this: LocalContext,
  _flags: Record<string, never>,
  file: string,
): Promise<void> {
  const { process, writer } = this;

  try {
    const config = loadConfig();
    const input = readBoardInput(file);

    const board = await saveBoard(config, input);

    writer.write(`Created: ${board.name} (id: ${board.id})`);
    writer.write(`Visibility: ${board.visibility ?? ""}`);
    writer.write(`View: ${boardViewURL(config, board.workspaceId, board.id)}`);
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
      parameters: [
        {
          brief: "Path to a board (dashboard) JSON file",
          parse: String,
        },
      ],
    },
    flags: {},
  },
  docs: {
    brief: "Create a board (dashboard) from a JSON file",
  },
});
