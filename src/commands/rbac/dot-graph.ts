import type { RbacGroup } from "../../gql/rbac/groups";
import type { RbacGroupmember } from "../../gql/rbac/group-members";
import type { RbacStatement } from "../../gql/rbac/statements";
import type { RbacUser } from "../../gql/rbac/users";

/**
 * GraphViz DOT generation for RBAC relationships.
 *
 * Ported from the Go CLI (`cmd_rbac_dot.go`). Two graphs are supported:
 *
 * - {@link buildUserGroupsDot}: the transitive group membership of a single
 *   user (`rbac dot --user <id>`).
 * - {@link buildFullConnectivityDot}: every user, group, and statement and the
 *   edges between them, laid out in three clusters (`rbac dot --all`).
 *
 * Go iterated Go maps (unordered) so the line order was nondeterministic; here
 * we sort the collections so output is stable across runs. The emitted node
 * shapes, cluster attributes, edge weights, and label formatting match the Go
 * output exactly.
 */

/** Quote a string as a DOT identifier/label (Go's `%q`). */
function dotQuote(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Human-readable statement label. Mirrors `dotStmtName` in the Go CLI: the
 * first set object scoping field wins, in this exact priority order.
 */
export function statementLabel(s: RbacStatement): string {
  const role = s.role;
  const obj = s.object;
  if (obj.objectId != null) {
    return `${role} obj ${obj.objectId}`;
  }
  if (obj.folderId != null) {
    return `${role} fld ${obj.folderId}`;
  }
  if (obj.workspaceId != null) {
    return `${role} wks ${obj.workspaceId}`;
  }
  if (obj.type != null) {
    return `${role} ${obj.type}`;
  }
  if (obj.owner === true) {
    return `${role} Owner`;
  }
  if (obj.all === true) {
    return `${role} All`;
  }
  return `${role} ?`;
}

/**
 * Build the transitive group-membership graph for a single user.
 * Mirrors `plotUserGroupsDot` + `recursivePlotGroups`.
 */
export function buildUserGroupsDot(
  user: RbacUser,
  groups: RbacGroup[],
  members: RbacGroupmember[],
): string {
  const groupMap = new Map(groups.map((g) => [g.id, g]));
  const out: string[] = [];
  out.push("digraph {");
  out.push("  node [shape=box];");
  out.push("  rankdir=LR;");
  out.push("  ranksep=1.5;");
  out.push(`  ${dotQuote(user.id)} [label=${dotQuote(user.name)}];`);

  // seed with the user's direct group memberships
  const groupsToGo: string[] = [];
  for (const m of members) {
    if (m.memberUserId != null && m.memberUserId === user.id) {
      out.push(`  ${dotQuote(user.id)} -> ${dotQuote(m.groupId)};`);
      groupsToGo.push(m.groupId);
    }
  }

  // plot transitive memberships
  const groupsDone = new Set<string>();
  recursivePlotGroups(out, groupsToGo, groupsDone, groupMap, members);
  out.push("}");
  return out.join("\n") + "\n";
}

function recursivePlotGroups(
  out: string[],
  groupsToGo: string[],
  groupsDone: Set<string>,
  groupMap: Map<string, RbacGroup>,
  members: RbacGroupmember[],
): void {
  for (const g of groupsToGo) {
    if (groupsDone.has(g)) {
      continue;
    }
    groupsDone.add(g);
    const gobj = groupMap.get(g);
    const label = gobj ? gobj.name : "";
    out.push(`  ${dotQuote(g)} [label=${dotQuote(label)}];`);
    const newgg: string[] = [];
    for (const m of members) {
      if (m.memberGroupId != null && m.memberGroupId === g) {
        out.push(`  ${dotQuote(g)} -> ${dotQuote(m.groupId)};`);
        newgg.push(m.groupId);
      }
    }
    recursivePlotGroups(out, newgg, groupsDone, groupMap, members);
  }
}

export interface RbacInstanceState {
  users: RbacUser[];
  groups: RbacGroup[];
  groupMembers: RbacGroupmember[];
  statements: RbacStatement[];
}

/**
 * Build the full connectivity graph across all users, groups and statements.
 * Mirrors `plotFullConnectivityDot`.
 */
export function buildFullConnectivityDot(ri: RbacInstanceState): string {
  const users = [...ri.users].sort((a, b) => a.id.localeCompare(b.id));
  const groups = [...ri.groups].sort((a, b) => a.id.localeCompare(b.id));
  const statements = [...ri.statements].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  const groupMembers = [...ri.groupMembers].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  const userIds = new Set(users.map((u) => u.id));

  const out: string[] = [];
  out.push("digraph {");
  out.push("  newrank=true;");
  out.push("  rankdir=LR;");
  out.push("  ranksep=10;");
  out.push("  subgraph cluster_users {");
  out.push('    label="Users";');
  out.push("    color=blue;");
  out.push("    node [shape=box fixedsize=true width=3 height=1];");
  for (const u of users) {
    out.push(`    u_${u.id} [label=${dotQuote(u.name)}];`);
  }
  out.push("  }");
  out.push("  subgraph cluster_groups {");
  out.push('    label="Groups";');
  out.push("    color=green;");
  out.push("    node [shape=house fixedsize=true width=3 height=2];");
  for (const g of groups) {
    out.push(`    ${dotQuote(g.id)} [label=${dotQuote(g.name)}];`);
  }
  out.push("  }");
  out.push("  All [shape=doublecircle width=2 height=2 fixedsize=true];");
  out.push("  subgraph cluster_statements {");
  out.push('    label="Statements";');
  out.push("    color=red;");
  out.push("    node [shape=oval fixedsize=true width=2 height=1];");
  for (const s of statements) {
    out.push(`    ${dotQuote(s.id)} [label=${dotQuote(statementLabel(s))}];`);
  }
  out.push("  }");

  for (const gm of groupMembers) {
    if (gm.memberUserId != null && userIds.has(gm.memberUserId)) {
      out.push(`  u_${gm.memberUserId} -> ${dotQuote(gm.groupId)} [weight=1];`);
    }
  }
  for (const gm of groupMembers) {
    if (gm.memberGroupId != null) {
      out.push(
        `  ${dotQuote(gm.memberGroupId)} -> ${dotQuote(gm.groupId)} [weight=2];`,
      );
    }
  }
  for (const s of statements) {
    if (s.subject.userId != null) {
      out.push(`  ${dotQuote(s.id)} -> u_${s.subject.userId} [weight=3];`);
    } else if (s.subject.groupId != null) {
      out.push(
        `  ${dotQuote(s.id)} -> ${dotQuote(s.subject.groupId)} [weight=2];`,
      );
    } else {
      out.push(`  ${dotQuote(s.id)} -> All [weight=1];`);
    }
  }
  out.push("}");
  return out.join("\n") + "\n";
}
