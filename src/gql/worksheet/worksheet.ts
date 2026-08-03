import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { parse } from "graphql";
import type { Config } from "../../lib/config";
import { executeGraphQL } from "../gql-request";

// Hand-authored GraphQL operations; mirror the queries in the Go fork
// (ot_worksheet.go / cmd_worksheet.go). Codegen is unavailable on this tenant
// (introspection disabled), so the operations and their types are by hand.
export interface WorksheetListEntry {
  id: string;
  name: string;
  workspaceId: string;
  updatedDate: string | null;
}

export interface WorksheetStage {
  stageID: string | null;
  pipeline: string | null;
}

export interface Worksheet {
  id: string;
  name: string;
  workspaceId: string;
  updatedDate: string | null;
  stages: WorksheetStage[] | null;
}

export interface SavedWorksheet {
  id: string;
  name: string;
  workspaceId: string;
}

// A worksheet input is an arbitrary worksheet JSON document; the API validates it.
type WorksheetInput = Record<string, unknown>;

interface SearchResult {
  worksheetSearch: {
    // NOTE: the live tenant schema returns `worksheets` here, not `results`
    // as the Go fork's ot_worksheet.go query assumed (schema drift). Verified
    // by probing the API (WorksheetSearchResultWrapper has no `results` field).
    worksheets: {
      worksheet: WorksheetListEntry | null;
      score: number | null;
    }[];
  };
}

interface SearchVariables {
  terms: { workspaceId: string; name?: string };
}

// NOTE: the Go fork declared a `$maxCount: Int` variable, but on the live
// tenant `maxCount` is typed `Int64`, so declaring it as `Int` 422s. We don't
// use maxCount, so it is omitted entirely.
const SearchDocument = parse(`
  query Worksheet_Search($terms: DWSearchInput!) {
    worksheetSearch(terms: $terms) {
      worksheets {
        worksheet { id name workspaceId updatedDate }
        score
      }
    }
  }
`) as unknown as TypedDocumentNode<SearchResult, SearchVariables>;

interface GetResult {
  worksheet: Worksheet | null;
}

const GetDocument = parse(`
  query Worksheet_Get($id: ObjectId!) {
    worksheet(id: $id) {
      id
      name
      workspaceId
      updatedDate
      stages { stageID pipeline }
    }
  }
`) as unknown as TypedDocumentNode<GetResult, { id: string }>;

interface SaveResult {
  saveWorksheet: SavedWorksheet;
}

const SaveDocument = parse(`
  mutation Worksheet_Save($wks: WorksheetInput!) {
    saveWorksheet(wks: $wks) {
      id
      name
      workspaceId
    }
  }
`) as unknown as TypedDocumentNode<SaveResult, { wks: WorksheetInput }>;

interface DeleteResult {
  deleteWorksheet: {
    success: boolean | null;
    errorMessage: string | null;
  };
}

const DeleteDocument = parse(`
  mutation Worksheet_Delete($id: ObjectId!) {
    deleteWorksheet(wks: $id) {
      success
      errorMessage
    }
  }
`) as unknown as TypedDocumentNode<DeleteResult, { id: string }>;

export async function searchWorksheets(
  config: Config,
  { workspaceId, name }: { workspaceId: string; name?: string },
) {
  const terms = name ? { workspaceId, name } : { workspaceId };
  const response = await executeGraphQL(config, SearchDocument, { terms });
  return response.data.worksheetSearch.worksheets
    .map((r) => r.worksheet)
    .filter((w): w is WorksheetListEntry => w !== null);
}

export async function getWorksheet(config: Config, id: string) {
  const response = await executeGraphQL(config, GetDocument, { id });
  return response.data.worksheet;
}

export async function saveWorksheet(config: Config, wks: WorksheetInput) {
  const response = await executeGraphQL(config, SaveDocument, { wks });
  return response.data.saveWorksheet;
}

export async function deleteWorksheet(config: Config, id: string) {
  const response = await executeGraphQL(config, DeleteDocument, { id });
  return response.data.deleteWorksheet;
}
