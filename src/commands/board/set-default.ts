import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { setDefaultDashboard } from "../../gql/board/board";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

export interface SetDefaultBoardDeps {
  loadConfig?: typeof loadConfig;
  setDefaultDashboard?: typeof setDefaultDashboard;
}

export async function setDefault(
  this: LocalContext,
  _flags: Record<string, never>,
  datasetId: string,
  boardId: string,
  deps: SetDefaultBoardDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    setDefaultDashboard: setDefaultDashboardImpl = setDefaultDashboard,
  } = deps;
  const { process, writer } = this;

  try {
    const config = loadConfigImpl();
    await setDefaultDashboardImpl(config, { dsid: datasetId, dashid: boardId });
    writer.write("Default dashboard set successfully");
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

export const setDefaultCommand = buildCommand({
  loader: async () => setDefault,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "Dataset ID to set the default dashboard for",
          parse: String,
        },
        {
          brief: "Board (dashboard) ID to set as default",
          parse: String,
        },
      ],
    },
    flags: {},
  },
  docs: {
    brief: "Set the default board (dashboard) for a dataset",
    fullDescription:
      "Set the default board (dashboard) shown for a dataset.\n\n" +
      "Example:\n" +
      "  observe board set-default 42450595 42000001",
  },
});
