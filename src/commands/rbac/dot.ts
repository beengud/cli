import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { GqlApiError } from "../../gql/gql-request";
import { listRbacGroups } from "../../gql/rbac/groups";
import { listRbacGroupmembers } from "../../gql/rbac/group-members";
import { listRbacStatements } from "../../gql/rbac/statements";
import { getRbacUser, listRbacUsers } from "../../gql/rbac/users";
import { loadConfig } from "../../lib/config";
import { buildFullConnectivityDot, buildUserGroupsDot } from "./dot-graph";

interface RbacDotFlags {
  user?: string;
  all?: boolean;
}

export interface RbacDotDeps {
  loadConfig?: typeof loadConfig;
  listRbacGroups?: typeof listRbacGroups;
  listRbacGroupmembers?: typeof listRbacGroupmembers;
  listRbacStatements?: typeof listRbacStatements;
  listRbacUsers?: typeof listRbacUsers;
  getRbacUser?: typeof getRbacUser;
}

export async function dot(
  this: LocalContext,
  flags: RbacDotFlags,
  deps: RbacDotDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    listRbacGroups: listRbacGroupsImpl = listRbacGroups,
    listRbacGroupmembers: listRbacGroupmembersImpl = listRbacGroupmembers,
    listRbacStatements: listRbacStatementsImpl = listRbacStatements,
    listRbacUsers: listRbacUsersImpl = listRbacUsers,
    getRbacUser: getRbacUserImpl = getRbacUser,
  } = deps;
  const { process, writer } = this;

  // Mirror the Go CLI: exactly one of --user / --all must be specified.
  if (flags.user != null && flags.all) {
    writer.error(
      "Error: you can only specify one kind of plot (--user, --all)",
    );
    process.exit(1);
    return;
  }
  if (flags.user == null && !flags.all) {
    writer.error("Error: you must specify exactly one plot (--user, --all)");
    process.exit(1);
    return;
  }

  try {
    const config = loadConfigImpl();

    if (flags.user != null) {
      const user = await getRbacUserImpl(config, { id: flags.user });
      if (user == null) {
        writer.error(`Error: user not found: ${flags.user}`);
        process.exit(1);
        return;
      }
      const [groups, members] = await Promise.all([
        listRbacGroupsImpl(config),
        listRbacGroupmembersImpl(config),
      ]);
      writer.write(buildUserGroupsDot(user, groups, members));
      return;
    }

    const [users, groups, groupMembers, statements] = await Promise.all([
      listRbacUsersImpl(config),
      listRbacGroupsImpl(config),
      listRbacGroupmembersImpl(config),
      listRbacStatementsImpl(config),
    ]);
    writer.write(
      buildFullConnectivityDot({ users, groups, groupMembers, statements }),
    );
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

export const dotCommand = buildCommand({
  loader: async () => dot,
  parameters: {
    positional: {
      kind: "tuple",
      parameters: [],
    },
    flags: {
      user: {
        kind: "parsed",
        parse: String,
        brief: "Plot the membership graph for a single user (by user ID)",
        optional: true,
      },
      all: {
        kind: "boolean",
        brief: "Plot all users, groups, and statements",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Output a GraphViz DOT graph of RBAC relationships",
    fullDescription: [
      "Output a GraphViz DOT graph of relationships between users, groups,",
      "and statements. Pipe the output to `dot` to render an image, e.g.:",
      "",
      "  observe rbac dot --all | dot -Tsvg -o rbac.svg",
      "",
      "Exactly one of --user or --all must be specified.",
    ].join("\n"),
  },
});
