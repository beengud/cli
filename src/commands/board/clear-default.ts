import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { clearDefaultDashboard } from "../../gql/board/board";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

export interface ClearDefaultBoardDeps {
  loadConfig?: typeof loadConfig;
  clearDefaultDashboard?: typeof clearDefaultDashboard;
}

export async function clearDefault(
  this: LocalContext,
  _flags: Record<string, never>,
  datasetId: string,
  deps: ClearDefaultBoardDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    clearDefaultDashboard: clearDefaultDashboardImpl = clearDefaultDashboard,
  } = deps;
  const { process, writer } = this;

  try {
    const config = loadConfigImpl();
    await clearDefaultDashboardImpl(config, { dsid: datasetId });
    writer.write("Default dashboard cleared successfully");
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

export const clearDefaultCommand = buildCommand({
  loader: async () => clearDefault,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Dataset ID to clear the default dashboard for",
          parse: String,
        },
      ],
    },
    flags: {},
  },
  docs: {
    brief: "Clear the default board (dashboard) for a dataset",
    fullDescription:
      "Clear the default board (dashboard) for a dataset.\n\n" +
      "Example:\n" +
      "  observe board clear-default 42450595",
  },
});
