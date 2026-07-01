import { defineCommand } from "../../lib/stricli-wrappers";
import type { LocalContext } from "../../context";
import {
  createFolder,
  lookupFolderByName,
  type Folder,
  type FolderInput,
} from "../../gql/folder/folder";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

interface CreateFolderFlags {
  workspace: string;
  ensure?: boolean;
  description?: string;
  iconUrl?: string;
}

function printFolder(
  writer: LocalContext["writer"],
  verb: string,
  folder: Folder,
): void {
  writer.write(`${verb}: ${folder.name} (id: ${folder.id})`);
  writer.write(`Workspace: ${folder.workspaceId}`);
}

async function create(
  this: LocalContext,
  flags: CreateFolderFlags,
  name: string,
): Promise<void> {
  const { process, writer } = this;

  try {
    const config = loadConfig();
    const workspaceId = flags.workspace;

    // --ensure makes create idempotent: if a folder with this name already
    // exists, return it instead of creating a duplicate.
    if (flags.ensure) {
      const existing = await lookupFolderByName(config, {
        workspaceId,
        name,
      });
      if (existing !== null) {
        printFolder(writer, "Exists", existing);
        return;
      }
    }

    const folderConfig: FolderInput = { name };
    if (flags.description) folderConfig.description = flags.description;
    if (flags.iconUrl) folderConfig.iconUrl = flags.iconUrl;

    const folder = await createFolder(config, {
      workspaceId,
      folder: folderConfig,
    });
    printFolder(writer, "Created", folder);
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

export const createCommand = defineCommand({
  loader: async () => create,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [{ brief: "Folder name", parse: String }],
    },
    flags: {
      workspace: {
        kind: "parsed",
        parse: String,
        brief: "Workspace ID to create the folder in",
        optional: false,
      },
      ensure: {
        kind: "boolean",
        brief:
          "Return the existing folder if one with this name already exists instead of failing",
        optional: true,
      },
      description: {
        kind: "parsed",
        parse: String,
        brief: "Folder description",
        optional: true,
      },
      iconUrl: {
        kind: "parsed",
        parse: String,
        brief: "Folder icon URL",
        optional: true,
      },
    },
    aliases: {
      w: "workspace",
    },
  },
  docs: {
    brief: "Create a folder (the grouping unit for boards/worksheets)",
  },
});
