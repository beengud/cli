import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { parse } from "graphql";
import type { Config } from "../../lib/config";
import { executeGraphQL } from "../gql-request";

// Hand-authored GraphQL operation; mirrors gqlListBoard in the Go fork (ot_board.go).
// NOTE: the workspaceId variable is typed `[ObjectId!]!` (an ARRAY) by the API —
// callers must pass [workspaceId].
export interface BoardListEntry {
  id: string;
  name: string;
  workspaceId: string;
  updatedDate: string | null;
}

interface BoardSearchItem {
  score: number | null;
  dashboard: BoardListEntry | null;
}

interface ListBoardsResult {
  dashboardSearch: {
    dashboards: BoardSearchItem[];
  };
}

interface ListBoardsVariables {
  workspaceId: string[];
}

const ListBoardsDocument = parse(`
  query Board_List($workspaceId: [ObjectId!]!) {
    dashboardSearch(terms: { workspaceId: $workspaceId }) {
      dashboards {
        score
        dashboard {
          id
          name
          workspaceId
          updatedDate
        }
      }
    }
  }
`) as unknown as TypedDocumentNode<ListBoardsResult, ListBoardsVariables>;

export async function listBoards(config: Config, workspaceId: string) {
  const response = await executeGraphQL(config, ListBoardsDocument, {
    workspaceId: [workspaceId],
  });
  return response.data.dashboardSearch.dashboards
    .map((item) => item.dashboard)
    .filter((d): d is BoardListEntry => d !== null);
}
