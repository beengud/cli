import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { saveBoard } from "../../gql/board/board";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";
import { boardViewURL, readBoardInput } from "./board-input";

export interface CreateBoardDeps {
  loadConfig?: typeof loadConfig;
  saveBoard?: typeof saveBoard;
  readBoardInput?: typeof readBoardInput;
}

export async function create(
  this: LocalContext,
  _flags: Record<string, never>,
  file: string,
  deps: CreateBoardDeps = {},
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
    const result = await saveBoardImpl(config, { input });

    writer.write(`Created: ${result.name} (id: ${result.id})`);
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

export const createCommand = buildCommand({
  loader: async () => create,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Path to DashboardInput JSON file (name, workspaceId, layout)",
          parse: String,
        },
      ],
    },
    flags: {},
  },
  docs: {
    brief: "Create a board (dashboard) from a JSON file",
    fullDescription:
      "Create a board (dashboard) from a DashboardInput JSON file.\n\n" +
      "The file must contain name, workspaceId, and layout; stages are optional.\n" +
      "Run 'observe board scaffold' to print a starting template.\n\n" +
      "Example:\n" +
      "  observe board create board.json",
  },
});
