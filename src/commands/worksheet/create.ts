import { buildCommand } from "@stricli/core";
import * as fs from "node:fs";
import type { LocalContext } from "../../context";
import {
  saveWorksheet,
  type WorksheetInput,
} from "../../gql/worksheet/save-worksheet";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

interface CreateWorksheetFlags {
  workspace?: string;
}

export interface CreateWorksheetDeps {
  loadConfig?: typeof loadConfig;
  saveWorksheet?: typeof saveWorksheet;
  readFile?: (path: string) => string;
}

// Fields the Observe API returns but rejects on the saveWorksheet input.
const READ_ONLY_FIELDS = ["updatedDate"] as const;

export async function create(
  this: LocalContext,
  flags: CreateWorksheetFlags,
  file: string,
  deps: CreateWorksheetDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    saveWorksheet: saveWorksheetImpl = saveWorksheet,
    readFile = (path: string) => fs.readFileSync(path, "utf-8"),
  } = deps;
  const { process, writer } = this;

  try {
    const config = loadConfigImpl();

    let raw: string;
    try {
      raw = readFile(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`could not read file "${file}": ${message}`);
    }

    let input: Record<string, unknown>;
    try {
      input = JSON.parse(raw) as Record<string, unknown>;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`could not parse JSON from "${file}": ${message}`);
    }

    for (const field of READ_ONLY_FIELDS) {
      delete input[field];
    }

    // A --workspace flag overrides the workspaceId in the file.
    if (flags.workspace) {
      input.workspaceId = flags.workspace;
    }

    if (!input.name) {
      throw new Error("worksheet input requires a name");
    }
    if (!input.workspaceId) {
      throw new Error(
        "worksheet input requires a workspaceId (set it in the file or pass --workspace)",
      );
    }
    if (!input.stages) {
      throw new Error("worksheet input requires stages");
    }

    const result = await saveWorksheetImpl(config, {
      wks: input as WorksheetInput,
    });

    writer.write(`Created: ${result.name} (id: ${result.id})`);
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

export const createCommand = buildCommand({
  loader: async () => create,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Path to a JSON file describing the worksheet (WorksheetInput)",
          parse: String,
        },
      ],
    },
    flags: {
      workspace: {
        kind: "parsed",
        parse: String,
        brief: "Workspace ID to create the worksheet in (overrides the file)",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Create a worksheet from a JSON file",
    fullDescription:
      "Create a worksheet from a JSON file describing a WorksheetInput.\n\n" +
      "The file must contain at least: name, workspaceId, and stages.\n" +
      "Each stage is an object with an id and a pipeline (OPAL).\n\n" +
      "Example:\n" +
      "  observe worksheet create ./worksheet.json\n" +
      "  observe worksheet create ./worksheet.json --workspace 41000001",
  },
});
