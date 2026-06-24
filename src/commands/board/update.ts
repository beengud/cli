import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { saveBoard } from "../../gql/board/board";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";
import { boardViewURL, readBoardInput } from "./board-input";

export interface UpdateBoardDeps {
  loadConfig?: typeof loadConfig;
  saveBoard?: typeof saveBoard;
  readBoardInput?: typeof readBoardInput;
}

export async function update(
  this: LocalContext,
  _flags: Record<string, never>,
  id: string,
  file: string,
  deps: UpdateBoardDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    saveBoard: saveBoardImpl = saveBoard,
    readBoardInput: readBoardInputImpl = readBoardInput,
  } = deps;
  const { process, writer } = this;

  try {
    const config = loadConfigImpl();
    const input = readBoardInputImpl(file);
    input["id"] = id;
    const result = await saveBoardImpl(config, { input });

    writer.write(`Updated: ${result.name} (id: ${result.id})`);
    writer.write(`Visibility: ${result.visibility}`);
    writer.write(
      `View: ${boardViewURL(config, result.workspaceId, result.id)}`,
    );
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

export const updateCommand = buildCommand({
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
          brief: "Path to DashboardInput JSON file",
          parse: String,
        },
      ],
    },
    flags: {},
  },
  docs: {
    brief: "Update a board (dashboard) from a JSON file",
    fullDescription:
      "Update an existing board (dashboard) from a DashboardInput JSON file.\n\n" +
      "Example:\n" +
      "  observe board update 42000001 board.json",
  },
});
