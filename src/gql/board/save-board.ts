import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { parse } from "graphql";
import type { Config } from "../../lib/config";
import { executeGraphQL } from "../gql-request";

// Hand-authored GraphQL operation. Codegen is unavailable on this tenant
// (introspection disabled), so the operation document and its types are
// declared by hand. Mirrors gqlSaveBoard in the Go fork (cmd_board.go).
export interface SavedBoard {
  id: string;
  name: string;
  workspaceId: string;
  folderId: string | null;
  visibility: string | null;
}

interface SaveBoardResult {
  saveDashboard: SavedBoard;
}

// A board input is an arbitrary dashboard JSON document; the API validates it.
type BoardInput = Record<string, unknown>;

interface SaveBoardVariables {
  input: BoardInput;
}

const SaveBoardDocument = parse(`
  mutation Board_Save($input: DashboardInput!) {
    saveDashboard(dash: $input) {
      id
      name
      workspaceId
      folderId
      visibility
    }
  }
`) as unknown as TypedDocumentNode<SaveBoardResult, SaveBoardVariables>;

export async function saveBoard(
  config: Config,
  input: BoardInput,
): Promise<SavedBoard> {
  const response = await executeGraphQL(config, SaveBoardDocument, { input });
  return response.data.saveDashboard;
}
