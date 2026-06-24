import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { deleteWorksheet } from "../../gql/worksheet/delete-worksheet";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

export interface DeleteWorksheetDeps {
  loadConfig?: typeof loadConfig;
  deleteWorksheet?: typeof deleteWorksheet;
}

export async function deleteWorksheetCommand(
  this: LocalContext,
  _flags: Record<string, never>,
  id: string,
  deps: DeleteWorksheetDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    deleteWorksheet: deleteWorksheetImpl = deleteWorksheet,
  } = deps;
  const { process, writer } = this;

  try {
    const config = loadConfigImpl();
    const result = await deleteWorksheetImpl(config, { id });

    if (result && result.success === false) {
      throw new Error(result.errorMessage || "delete failed");
    }

    writer.success(`Deleted worksheet ${id}`);
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

export const deleteCommand = buildCommand({
  loader: async () => deleteWorksheetCommand,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Worksheet ID",
          parse: String,
        },
      ],
    },
    flags: {},
  },
  docs: {
    brief: "Delete a worksheet by ID",
  },
});
