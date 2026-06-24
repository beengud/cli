import { describe, expect, test } from "bun:test";
import {
  buildFullConnectivityDot,
  buildUserGroupsDot,
  statementLabel,
} from "./dot-graph";
import type { RbacStatement } from "../../gql/rbac/statements";

function stmt(over: Partial<RbacStatement>): RbacStatement {
  return {
    id: "stmt-1",
    description: "",
    role: "Viewer",
    subject: { userId: null, groupId: null, all: null },
    object: {
      objectId: null,
      folderId: null,
      workspaceId: null,
      type: null,
      name: null,
      owner: null,
      all: null,
    },
    ...over,
  };
}

describe("statementLabel", () => {
  test("objectId wins first", () => {
    expect(
      statementLabel(stmt({ object: { ...stmt({}).object, objectId: "42" } })),
    ).toBe("Viewer obj 42");
  });
  test("folderId next", () => {
    expect(
      statementLabel(stmt({ object: { ...stmt({}).object, folderId: "7" } })),
    ).toBe("Viewer fld 7");
  });
  test("workspaceId next", () => {
    expect(
      statementLabel(
        stmt({ object: { ...stmt({}).object, workspaceId: "9" } }),
      ),
    ).toBe("Viewer wks 9");
  });
  test("type next", () => {
    expect(
      statementLabel(stmt({ object: { ...stmt({}).object, type: "Dataset" } })),
    ).toBe("Viewer Dataset");
  });
  test("owner true", () => {
    expect(
      statementLabel(stmt({ object: { ...stmt({}).object, owner: true } })),
    ).toBe("Viewer Owner");
  });
  test("all true", () => {
    expect(
      statementLabel(stmt({ object: { ...stmt({}).object, all: true } })),
    ).toBe("Viewer All");
  });
  test("falls back to ?", () => {
    expect(statementLabel(stmt({}))).toBe("Viewer ?");
  });
});

describe("buildUserGroupsDot", () => {
  test("plots transitive group membership for a user", () => {
    const user = {
      id: "100",
      name: "Ada",
      email: "a@x",
      status: "Active",
      role: "user",
    } as never;
    const groups = [
      { id: "g1", name: "Engineers", description: "" },
      { id: "g2", name: "Everyone", description: "" },
    ];
    const members = [
      {
        id: "m1",
        description: "",
        groupId: "g1",
        memberUserId: "100",
        memberGroupId: null,
      },
      {
        id: "m2",
        description: "",
        groupId: "g2",
        memberUserId: null,
        memberGroupId: "g1",
      },
    ];
    const dot = buildUserGroupsDot(user, groups, members);
    expect(dot).toContain("digraph {");
    expect(dot).toContain("  node [shape=box];");
    expect(dot).toContain("  rankdir=LR;");
    expect(dot).toContain("  ranksep=1.5;");
    expect(dot).toContain('  "100" [label="Ada"];');
    expect(dot).toContain('  "100" -> "g1";');
    expect(dot).toContain('  "g1" [label="Engineers"];');
    expect(dot).toContain('  "g1" -> "g2";');
    expect(dot).toContain('  "g2" [label="Everyone"];');
    expect(dot.trimEnd().endsWith("}")).toBe(true);
  });
});

describe("buildFullConnectivityDot", () => {
  test("emits clusters and weighted edges", () => {
    const dot = buildFullConnectivityDot({
      users: [
        {
          id: "100",
          name: "Ada",
          email: "a@x",
          status: "Active",
          role: "user",
        } as never,
      ],
      groups: [{ id: "g1", name: "Engineers", description: "" }],
      groupMembers: [
        {
          id: "m1",
          description: "",
          groupId: "g1",
          memberUserId: "100",
          memberGroupId: null,
        },
      ],
      statements: [
        stmt({
          id: "s1",
          subject: { userId: "100", groupId: null, all: null },
          object: { ...stmt({}).object, all: true },
        }),
      ],
    });
    expect(dot).toContain("  newrank=true;");
    expect(dot).toContain("  subgraph cluster_users {");
    expect(dot).toContain('    u_100 [label="Ada"];');
    expect(dot).toContain("  subgraph cluster_groups {");
    expect(dot).toContain('    "g1" [label="Engineers"];');
    expect(dot).toContain(
      "  All [shape=doublecircle width=2 height=2 fixedsize=true];",
    );
    expect(dot).toContain("  subgraph cluster_statements {");
    expect(dot).toContain('    "s1" [label="Viewer All"];');
    expect(dot).toContain('  u_100 -> "g1" [weight=1];');
    expect(dot).toContain('  "s1" -> u_100 [weight=3];');
  });
});
