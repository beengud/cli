import { defineCommand } from "../../lib/stricli-wrappers";
import type { LocalContext } from "../../context";
import { lookupFolderByName } from "../../gql/folder/folder";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

interface GetFolderFlags {
  workspace: string;
}

async function get(
  this: LocalContext,
  flags: GetFolderFlags,
  name: string,
): Promise<void> {
  const { process, writer } = this;

  try {
    const config = loadConfig();
    const folder = await lookupFolderByName(config, {
      workspaceId: flags.workspace,
      name,
    });

    if (folder === null) {
      writer.error(
        `Error: folder get: no folder named "${name}" in workspace ${flags.workspace}`,
      );
      process.exit(1);
      return;
    }

    writer.write(`Found: ${folder.name} (id: ${folder.id})`);
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

export const getCommand = defineCommand({
  loader: async () => get,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [{ brief: "Folder name", parse: String }],
    },
    flags: {
      workspace: {
        kind: "parsed",
        parse: String,
        brief: "Workspace ID to look up the folder in",
        optional: false,
      },
    },
    aliases: {
      w: "workspace",
    },
  },
  docs: {
    brief: "Look up a folder by name and print its ID",
  },
});
