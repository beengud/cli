import { defineCommand } from "../../lib/stricli-wrappers";
import type { LocalContext } from "../../context";
import { saveBoard } from "../../gql/board/save-board";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";
import { readBoardInput } from "./read-input";
import { boardViewURL } from "./view-url";

async function update(
  this: LocalContext,
  _flags: Record<string, never>,
  id: string,
  file: string,
): Promise<void> {
  const { process, writer } = this;

  try {
    const config = loadConfig();
    const input = readBoardInput(file);
    input.id = id;

    const board = await saveBoard(config, input);

    writer.write(`Updated: ${board.name} (id: ${board.id})`);
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

export const updateCommand = defineCommand({
  loader: async () => update,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Board (dashboard) ID to update",
          parse: String,
        },
        {
          brief: "Path to a board (dashboard) JSON file",
          parse: String,
        },
      ],
    },
    flags: {},
  },
  docs: {
    brief: "Update an existing board (dashboard) from a JSON file",
  },
});
