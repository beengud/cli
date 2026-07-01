import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { parse } from "graphql";
import type { Config } from "../../lib/config";
import { executeGraphQL } from "../gql-request";

// Hand-authored GraphQL operation; mirrors gqlGetBoard in the Go fork (ot_board.go).
export interface BoardStageInput {
  inputName: string | null;
  datasetId: string | null;
  stageId: string | null;
  inputRole: string | null;
}

export interface BoardStage {
  id: string | null;
  stageID: string | null;
  pipeline: string | null;
  input: BoardStageInput[] | null;
}

export interface Board {
  id: string;
  name: string;
  workspaceId: string;
  description: string | null;
  folderId: string | null;
  visibility: string | null;
  updatedDate: string | null;
  layout: unknown;
  stages: BoardStage[] | null;
}

interface GetBoardResult {
  dashboard: Board | null;
}

interface GetBoardVariables {
  id: string;
}

const GetBoardDocument = parse(`
  query Board_Get($id: ObjectId!) {
    dashboard(id: $id) {
      id
      name
      workspaceId
      description
      folderId
      visibility
      updatedDate
      layout
      stages {
        id
        stageID
        pipeline
        input {
          inputName
          datasetId
          stageId
          inputRole
        }
      }
    }
  }
`) as unknown as TypedDocumentNode<GetBoardResult, GetBoardVariables>;

export async function getBoard(config: Config, id: string) {
  const response = await executeGraphQL(config, GetBoardDocument, { id });
  return response.data.dashboard;
}
