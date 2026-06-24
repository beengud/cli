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
import type { LocalContext } from "../../../context";
import { createWriter } from "../../../lib/writer";

const repoRoot = resolve(import.meta.dir, "../../../..");

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const listRbacGroupsFn = mock(() =>
  Promise.resolve([
    { id: "g1", name: "Engineers", description: "Eng group" },
    { id: "g2", name: "Everyone", description: "" },
  ]),
);

let list: (typeof import("./list"))["list"];

const deps = {
  loadConfig: loadConfigFn,
  listRbacGroups: listRbacGroupsFn,
} as unknown as Parameters<(typeof import("./list"))["list"]>[1];

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

  const mod = await import("./list.ts");
  list = mod.list;
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

describe("rbac group list", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    listRbacGroupsFn.mockClear();
  });

  test("outputs all groups as JSON by default", async () => {
    const { context, stdout } = createMockContext();
    await list.call(context, {}, deps);
    const output = JSON.parse(stdout.join(""));
    expect(output).toHaveLength(2);
    expect(output[0].name).toBe("Engineers");
  });

  test("filters by name substring (case-insensitive)", async () => {
    const { context, stdout } = createMockContext();
    await list.call(context, { match: "every" }, deps);
    const output = JSON.parse(stdout.join(""));
    expect(output).toHaveLength(1);
    expect(output[0].id).toBe("g2");
  });

  test("renders CSV with --format csv", async () => {
    const { context, stdout } = createMockContext();
    await list.call(context, { format: "csv" }, deps);
    const out = stdout.join("");
    expect(out.split("\n")[0]).toBe("id,name,description");
    expect(out).toContain("g1,Engineers,Eng group");
  });

  test("exits 1 on API error", async () => {
    listRbacGroupsFn.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await list.call(context, {}, deps);
    } catch (e) {
      expect((e as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("Error");
  });
});
