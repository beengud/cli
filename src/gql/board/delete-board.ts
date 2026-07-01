import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { parse } from "graphql";
import type { Config } from "../../lib/config";
import { executeGraphQL } from "../gql-request";

// Hand-authored GraphQL operation; mirrors gqlDeleteBoard in the Go fork (ot_board.go).
interface ResultStatus {
  success: boolean | null;
  errorMessage: string | null;
}

interface DeleteBoardResult {
  deleteDashboard: ResultStatus;
}

interface DeleteBoardVariables {
  id: string;
}

const DeleteBoardDocument = parse(`
  mutation Board_Delete($id: ObjectId!) {
    deleteDashboard(id: $id) {
      success
      errorMessage
    }
  }
`) as unknown as TypedDocumentNode<DeleteBoardResult, DeleteBoardVariables>;

export async function deleteBoard(config: Config, id: string) {
  const response = await executeGraphQL(config, DeleteBoardDocument, { id });
  return response.data.deleteDashboard;
}
