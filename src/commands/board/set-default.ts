import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import {
  clearDefaultDashboard,
  setDefaultDashboard,
} from "../../gql/board/default-dashboard";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

function handleError(this: LocalContext, error: unknown): void {
  const { process, writer } = this;
  if (error instanceof GqlApiError) {
    writer.error(`API Error (${error.statusCode}): ${error.message}`);
  } else {
    const message = error instanceof Error ? error.message : String(error);
    writer.error(`Error: ${message}`);
  }
  process.exit(1);
}

async function setDefault(
  this: LocalContext,
  _flags: Record<string, never>,
  dsid: string,
  bid: string,
): Promise<void> {
  const { process, writer } = this;
  try {
    const config = loadConfig();
    const result = await setDefaultDashboard(config, { dsid, dashid: bid });
    // Only treat as failure when `success` is explicitly false; the API may
    // populate `errorMessage` with a success notice.
    if (result.success === false) {
      writer.error(
        `Error: board set-default: ${result.errorMessage ?? "failed"}`,
      );
      process.exit(1);
      return;
    }
    writer.write("Default dashboard set successfully");
  } catch (error) {
    handleError.call(this, error);
  }
}

async function clearDefault(
  this: LocalContext,
  _flags: Record<string, never>,
  dsid: string,
): Promise<void> {
  const { process, writer } = this;
  try {
    const config = loadConfig();
    const result = await clearDefaultDashboard(config, dsid);
    // Only treat as failure when `success` is explicitly false; the API may
    // populate `errorMessage` with a success notice.
    if (result.success === false) {
      writer.error(
        `Error: board clear-default: ${result.errorMessage ?? "failed"}`,
      );
      process.exit(1);
      return;
    }
    writer.write("Default dashboard cleared successfully");
  } catch (error) {
    handleError.call(this, error);
  }
}

export const setDefaultCommand = buildCommand({
  loader: async () => setDefault,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        { brief: "Dataset ID", parse: String },
        { brief: "Board (dashboard) ID", parse: String },
      ],
    },
    flags: {},
  },
  docs: {
    brief: "Set the default dashboard for a dataset",
  },
});

export const clearDefaultCommand = buildCommand({
  loader: async () => clearDefault,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [{ brief: "Dataset ID", parse: String }],
    },
    flags: {},
  },
  docs: {
    brief: "Clear the default dashboard for a dataset",
  },
});
