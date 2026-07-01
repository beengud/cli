import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { parse } from "graphql";
import { type Config } from "../../lib/config";
import { executeGraphQL, GqlApiError } from "../gql-request";

// Hand-authored GraphQL operations; mirror the queries in the Go fork (cmd_folder.go).
export interface Folder {
  id: string;
  name: string;
  workspaceId: string;
  description: string | null;
  iconUrl: string | null;
}

// FolderInput is a partial folder config; name is omitted on update-subset calls.
export interface FolderInput {
  name?: string;
  description?: string;
  iconUrl?: string;
}

interface CreateFolderResult {
  createFolder: Folder;
}

interface CreateFolderVariables {
  workspaceId: string;
  config: FolderInput;
}

const CreateFolderDocument = parse(`
  mutation Folder_Create($workspaceId: ObjectId!, $config: FolderInput!) {
    createFolder(workspaceId: $workspaceId, folder: $config) {
      id
      name
      workspaceId
      description
      iconUrl
    }
  }
`) as unknown as TypedDocumentNode<CreateFolderResult, CreateFolderVariables>;

interface UpdateFolderResult {
  updateFolder: Folder;
}

interface UpdateFolderVariables {
  id: string;
  config: FolderInput;
}

const UpdateFolderDocument = parse(`
  mutation Folder_Update($id: ObjectId!, $config: FolderInput!) {
    updateFolder(id: $id, folder: $config) {
      id
      name
      workspaceId
      description
      iconUrl
    }
  }
`) as unknown as TypedDocumentNode<UpdateFolderResult, UpdateFolderVariables>;

interface DeleteFolderResult {
  deleteFolder: {
    success: boolean | null;
    errorMessage: string | null;
  };
}

interface DeleteFolderVariables {
  id: string;
}

const DeleteFolderDocument = parse(`
  mutation Folder_Delete($id: ObjectId!) {
    deleteFolder(id: $id) {
      success
      errorMessage
    }
  }
`) as unknown as TypedDocumentNode<DeleteFolderResult, DeleteFolderVariables>;

interface LookupFolderResult {
  workspace: {
    folder: Folder | null;
  } | null;
}

interface LookupFolderVariables {
  workspaceId: string;
  name: string;
}

const LookupFolderDocument = parse(`
  query Folder_Lookup($workspaceId: ObjectId!, $name: String!) {
    workspace(id: $workspaceId) {
      folder(name: $name) {
        id
        name
        workspaceId
        description
        iconUrl
      }
    }
  }
`) as unknown as TypedDocumentNode<LookupFolderResult, LookupFolderVariables>;

export async function createFolder(
  config: Config,
  { workspaceId, folder }: { workspaceId: string; folder: FolderInput },
) {
  const response = await executeGraphQL(config, CreateFolderDocument, {
    workspaceId,
    config: folder,
  });
  return response.data.createFolder;
}

export async function updateFolder(
  config: Config,
  { id, folder }: { id: string; folder: FolderInput },
) {
  const response = await executeGraphQL(config, UpdateFolderDocument, {
    id,
    config: folder,
  });
  return response.data.updateFolder;
}

export async function deleteFolder(config: Config, id: string) {
  const response = await executeGraphQL(config, DeleteFolderDocument, { id });
  return response.data.deleteFolder;
}

/**
 * Look up a folder by exact name within a workspace. Returns null if none.
 *
 * When no folder with this name exists, the API returns a GraphQL error (not a
 * null result), e.g.: There is no folder named "x" in workspace N. That
 * specific case is treated as "not found" (null) so callers — notably
 * `create --ensure` — proceed to create rather than failing. Mirrors
 * lookupFolderByName in the Go fork (cmd_folder.go).
 */
export async function lookupFolderByName(
  config: Config,
  { workspaceId, name }: { workspaceId: string; name: string },
): Promise<Folder | null> {
  try {
    const response = await executeGraphQL(config, LookupFolderDocument, {
      workspaceId,
      name,
    });
    return response.data.workspace?.folder ?? null;
  } catch (error) {
    if (
      error instanceof GqlApiError &&
      error.message.includes("no folder named")
    ) {
      return null;
    }
    throw error;
  }
}
