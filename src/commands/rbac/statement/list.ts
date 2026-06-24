import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../../context";
import { GqlApiError } from "../../../gql/gql-request";
import { listRbacStatements } from "../../../gql/rbac/statements";
import { loadConfig } from "../../../lib/config";
import { renderAsCSV } from "../../../lib/formatters/csv";

type OutputFormat = "json" | "csv";

interface ListRbacStatementsFlags {
  format?: OutputFormat;
}

export interface ListRbacStatementsDeps {
  loadConfig?: typeof loadConfig;
  listRbacStatements?: typeof listRbacStatements;
}

export async function list(
  this: LocalContext,
  flags: ListRbacStatementsFlags,
  deps: ListRbacStatementsDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    listRbacStatements: listRbacStatementsImpl = listRbacStatements,
  } = deps;
  const { process, writer } = this;

  try {
    const config = loadConfigImpl();
    const statements = await listRbacStatementsImpl(config);
    if (flags.format === "csv") {
      writer.write(renderAsCSV(statements));
      return;
    }
    writer.write(JSON.stringify(statements, null, 2));
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

export const listCommand = buildCommand({
  loader: async () => list,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [],
    },
    flags: {
      format: {
        kind: "enum",
        values: ["json", "csv"],
        brief: "Output format (json, csv)",
        optional: true,
      },
    },
  },
  docs: {
    brief: "List RBAC statements",
  },
});
