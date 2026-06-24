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
const gqlModulePath = resolve(repoRoot, "src/gql/worksheet/get-worksheet.ts");

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const getWorksheetFn = mock((_config: unknown, _variables: unknown) =>
  Promise.resolve({
    id: "ws-1",
    name: "Sheet A",
    workspaceId: "41000001",
    updatedDate: "x",
    stages: [{ id: "stage-0", pipeline: "filter true" }],
  }),
);

let get: (typeof import("./get"))["get"];

const deps = {
  loadConfig: loadConfigFn,
} as Parameters<(typeof import("./get"))["get"]>[3];

beforeAll(async () => {
  void mock.module(gqlModulePath, () => ({
    getWorksheet: getWorksheetFn,
  }));
  const mod = await import("./get.ts");
  get = mod.get;
});

afterAll(() => {
  mock.restore();
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

describe("worksheet get", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    getWorksheetFn.mockClear();
  });

  test("outputs worksheet JSON including stages", async () => {
    const { context, stdout } = createMockContext();
    await get.call(context, {}, "ws-1", deps);

    expect(getWorksheetFn).toHaveBeenCalledTimes(1);
    const [, variables] = getWorksheetFn.mock.calls[0]!;
    expect(variables).toEqual({ id: "ws-1" });
    const output = JSON.parse(stdout.join(""));
    expect(output.id).toBe("ws-1");
    expect(output.stages).toHaveLength(1);
    expect(output.stages[0].id).toBe("stage-0");
  });

  test("exits 1 when worksheet not found", async () => {
    getWorksheetFn.mockImplementationOnce(() => Promise.resolve(null));
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await get.call(context, {}, "missing", deps);
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("not found");
  });
});
