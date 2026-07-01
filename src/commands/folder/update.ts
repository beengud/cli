import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { updateFolder, type FolderInput } from "../../gql/folder/folder";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

interface UpdateFolderFlags {
  name?: string;
  description?: string;
  iconUrl?: string;
}

async function update(
  this: LocalContext,
  flags: UpdateFolderFlags,
  id: string,
): Promise<void> {
  const { process, writer } = this;

  try {
    const folderConfig: FolderInput = {};
    if (flags.name) folderConfig.name = flags.name;
    if (flags.description) folderConfig.description = flags.description;
    if (flags.iconUrl) folderConfig.iconUrl = flags.iconUrl;

    if (Object.keys(folderConfig).length === 0) {
      writer.error(
        "Error: folder update: nothing to change; pass --name, --description, and/or --icon-url",
      );
      process.exit(1);
      return;
    }

    const config = loadConfig();
    const folder = await updateFolder(config, { id, folder: folderConfig });

    writer.write(`Updated: ${folder.name} (id: ${folder.id})`);
    writer.write(`Workspace: ${folder.workspaceId}`);
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

export const updateCommand = buildCommand({
  loader: async () => update,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [{ brief: "Folder ID to update", parse: String }],
    },
    flags: {
      name: {
        kind: "parsed",
        parse: String,
        brief: "New folder name",
        optional: true,
      },
      description: {
        kind: "parsed",
        parse: String,
        brief: "New folder description",
        optional: true,
      },
      iconUrl: {
        kind: "parsed",
        parse: String,
        brief: "New folder icon URL",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Update a folder's name, description, or icon URL",
  },
});
