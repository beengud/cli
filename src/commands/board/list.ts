import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { searchBoards } from "../../gql/board/board";
import type { SearchBoardsQueryVariables } from "../../gql/generated/graphql";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

interface ListBoardsFlags {
  name?: string;
  folder?: string;
  workspace?: string;
}

export interface ListBoardsDeps {
  loadConfig?: typeof loadConfig;
  searchBoards?: typeof searchBoards;
}

export async function list(
  this: LocalContext,
  flags: ListBoardsFlags,
  deps: ListBoardsDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    searchBoards: searchBoardsImpl = searchBoards,
  } = deps;
  const { process, writer } = this;

  try {
    const config = loadConfigImpl();

    // DWSearchInput fields are all lists; only include the terms that are set.
    const terms: SearchBoardsQueryVariables["terms"] = {};
    if (flags.name) terms.name = [flags.name];
    if (flags.workspace) terms.workspaceId = [flags.workspace];
    if (flags.folder) terms.folderId = [flags.folder];

    const items = await searchBoardsImpl(config, { terms });
    const boards = items.map((item) => item.dashboard);
    writer.write(JSON.stringify(boards, null, 2));
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

export const listCommand = buildCommand({
  loader: async () => list,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [],
    },
    flags: {
      name: {
        kind: "parsed",
        parse: String,
        brief: "Filter boards by name (case-insensitive substring)",
        optional: true,
      },
      folder: {
        kind: "parsed",
        parse: String,
        brief: "Filter boards by folder ID",
        optional: true,
      },
      workspace: {
        kind: "parsed",
        parse: String,
        brief: "Filter boards by workspace ID",
        optional: true,
      },
    },
  },
  docs: {
    brief: "List boards (dashboards)",
    fullDescription:
      "List boards (dashboards) via dashboard search, with optional filters.\n\n" +
      "Examples:\n" +
      "  observe board list\n" +
      '  observe board list --name "CPU" --workspace 42379913',
  },
});
