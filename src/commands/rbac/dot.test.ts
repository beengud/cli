import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";
import { resolve } from "node:path";
import type { LocalContext } from "../../context";
import { createWriter } from "../../lib/writer";

const repoRoot = resolve(import.meta.dir, "../../..");

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const listRbacGroupsFn = mock(() =>
  Promise.resolve([{ id: "g1", name: "Engineers", description: "" }]),
);
const listRbacGroupmembersFn = mock(() =>
  Promise.resolve([
    {
      id: "m1",
      description: "",
      groupId: "g1",
      memberUserId: "100",
      memberGroupId: null,
    },
  ]),
);
const listRbacStatementsFn = mock(() =>
  Promise.resolve([
    {
      id: "s1",
      description: "",
      role: "Viewer",
      subject: { userId: "100", groupId: null, all: null },
      object: {
        objectId: null,
        folderId: null,
        workspaceId: null,
        type: null,
        name: null,
        owner: null,
        all: true,
      },
    },
  ]),
);
const listRbacUsersFn = mock(() =>
  Promise.resolve([
    { id: "100", name: "Ada", email: "a@x", status: "Active", role: "user" },
  ]),
);
const getRbacUserFn = mock((_c: unknown, vars: { id: string }) =>
  Promise.resolve(
    vars.id === "100"
      ? { id: "100", name: "Ada", email: "a@x", status: "Active", role: "user" }
      : null,
  ),
);

let dot: (typeof import("./dot"))["dot"];

const deps = {
  loadConfig: loadConfigFn,
  listRbacGroups: listRbacGroupsFn,
  listRbacGroupmembers: listRbacGroupmembersFn,
  listRbacStatements: listRbacStatementsFn,
  listRbacUsers: listRbacUsersFn,
  getRbacUser: getRbacUserFn,
} as unknown as Parameters<(typeof import("./dot"))["dot"]>[1];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  void mock.module(resolve(repoRoot, "src/gql/rbac/groups.ts"), () => ({
    listRbacGroups: listRbacGroupsFn,
  }));
  void mock.module(resolve(repoRoot, "src/gql/rbac/group-members.ts"), () => ({
    listRbacGroupmembers: listRbacGroupmembersFn,
  }));
  void mock.module(resolve(repoRoot, "src/gql/rbac/statements.ts"), () => ({
    listRbacStatements: listRbacStatementsFn,
  }));
  void mock.module(resolve(repoRoot, "src/gql/rbac/users.ts"), () => ({
    listRbacUsers: listRbacUsersFn,
    getRbacUser: getRbacUserFn,
  }));

  const mod = await import("./dot.ts");
  dot = mod.dot;
});

afterAll(() => {
  mock.restore();
  if (previousNoColor === undefined) delete process.env.NO_COLOR;
  else process.env.NO_COLOR = previousNoColor;
  if (previousForceColor === undefined) delete process.env.FORCE_COLOR;
  else process.env.FORCE_COLOR = previousForceColor;
});

function createMockContext() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  let exitCode: number | undefined;
  const processMock = {
    stdout: {
      write: (msg: string) => {
        stdout.push(msg);
        return true;
      },
    },
    stderr: {
      write: (msg: string) => {
        stderr.push(msg);
        return true;
      },
    },
    exit: (code?: number) => {
      exitCode = code ?? 0;
      throw new Error("process.exit");
    },
  };
  const context = {
    process: processMock,
    writer: createWriter({ process: processMock }),
  } as unknown as LocalContext;
  return { context, stdout, stderr, getExitCode: () => exitCode };
}

describe("rbac dot", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    listRbacGroupsFn.mockClear();
    listRbacGroupmembersFn.mockClear();
    listRbacStatementsFn.mockClear();
    listRbacUsersFn.mockClear();
    getRbacUserFn.mockClear();
  });

  test("errors when neither --user nor --all given", async () => {
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await dot.call(context, {}, deps);
    } catch (e) {
      expect((e as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("must specify exactly one");
  });

  test("errors when both --user and --all given", async () => {
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await dot.call(context, { user: "100", all: true }, deps);
    } catch (e) {
      expect((e as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("only specify one");
  });

  test("--user emits a user-membership digraph", async () => {
    const { context, stdout } = createMockContext();
    await dot.call(context, { user: "100" }, deps);
    const out = stdout.join("");
    expect(out).toContain("digraph {");
    expect(out).toContain('"100" [label="Ada"];');
    expect(out).toContain('"100" -> "g1";');
    expect(getRbacUserFn).toHaveBeenCalledTimes(1);
  });

  test("--user with unknown id exits 1", async () => {
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await dot.call(context, { user: "999" }, deps);
    } catch (e) {
      expect((e as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("user not found");
  });

  test("--all emits full connectivity graph", async () => {
    const { context, stdout } = createMockContext();
    await dot.call(context, { all: true }, deps);
    const out = stdout.join("");
    expect(out).toContain("subgraph cluster_users {");
    expect(out).toContain("subgraph cluster_statements {");
    expect(out).toContain('"s1" -> u_100 [weight=3];');
  });
});
