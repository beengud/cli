import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../../context";
import { GqlApiError } from "../../../gql/gql-request";
import { listRbacGroups } from "../../../gql/rbac/groups";
import { loadConfig } from "../../../lib/config";
import { filterByName } from "../../../lib/filter";
import { renderAsCSV } from "../../../lib/formatters/csv";

type OutputFormat = "json" | "csv";

interface ListRbacGroupsFlags {
  match?: string;
  format?: OutputFormat;
}

export interface ListRbacGroupsDeps {
  loadConfig?: typeof loadConfig;
  listRbacGroups?: typeof listRbacGroups;
}

export async function list(
  this: LocalContext,
  flags: ListRbacGroupsFlags,
  deps: ListRbacGroupsDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    listRbacGroups: listRbacGroupsImpl = listRbacGroups,
  } = deps;
  const { process, writer } = this;

  try {
    const config = loadConfigImpl();
    const groups = filterByName(await listRbacGroupsImpl(config), flags.match);
    if (flags.format === "csv") {
      writer.write(renderAsCSV(groups));
      return;
    }
    writer.write(JSON.stringify(groups, null, 2));
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
      match: {
        kind: "parsed",
        parse: String,
        brief: "Filter groups by name substring (case-insensitive)",
        optional: true,
      },
      format: {
        kind: "enum",
        values: ["json", "csv"],
        brief: "Output format (json, csv)",
        optional: true,
      },
    },
  },
  docs: {
    brief: "List RBAC groups",
  },
});
