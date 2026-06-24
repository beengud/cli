import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../../context";
import { GqlApiError } from "../../../gql/gql-request";
import { getRbacGroup } from "../../../gql/rbac/groups";
import { listRbacGroupmembers } from "../../../gql/rbac/group-members";
import { loadConfig } from "../../../lib/config";
import { renderAsCSV } from "../../../lib/formatters/csv";

type OutputFormat = "json" | "csv";

interface GetRbacGroupFlags {
  format?: OutputFormat;
  members?: boolean;
}

export interface GetRbacGroupDeps {
  loadConfig?: typeof loadConfig;
  getRbacGroup?: typeof getRbacGroup;
  listRbacGroupmembers?: typeof listRbacGroupmembers;
}

export async function get(
  this: LocalContext,
  flags: GetRbacGroupFlags,
  id: string,
  deps: GetRbacGroupDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    getRbacGroup: getRbacGroupImpl = getRbacGroup,
    listRbacGroupmembers: listRbacGroupmembersImpl = listRbacGroupmembers,
  } = deps;
  const { process, writer } = this;

  try {
    const config = loadConfigImpl();
    const group = await getRbacGroupImpl(config, { id });

    // Optionally fold in this group's direct members (read-only access to
    // group membership), filtered client-side from the full membership list.
    const result = flags.members
      ? {
          ...group,
          members: (await listRbacGroupmembersImpl(config)).filter(
            (m) => m.groupId === id,
          ),
        }
      : group;

    if (flags.format === "csv") {
      writer.write(renderAsCSV(result));
      return;
    }
    writer.write(JSON.stringify(result, null, 2));
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

export const getCommand = buildCommand({
  loader: async () => get,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [
        {
          brief: "RBAC group ID (ORN)",
          parse: String,
        },
      ],
    },
    flags: {
      members: {
        kind: "boolean",
        brief: "Include the group's direct members",
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
    brief: "Get an RBAC group by ID",
  },
});
