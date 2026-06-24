import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { getBoard } from "../../gql/board/board";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

export interface GetBoardDeps {
  loadConfig?: typeof loadConfig;
  getBoard?: typeof getBoard;
}

export async function get(
  this: LocalContext,
  _flags: Record<string, never>,
  id: string,
  deps: GetBoardDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    getBoard: getBoardImpl = getBoard,
  } = deps;
  const { process, writer } = this;

  try {
    const config = loadConfigImpl();
    const result = await getBoardImpl(config, { id });
    writer.write(JSON.stringify(result, null, 2));
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
    brief: "Get a board (dashboard) by ID",
  },
});
