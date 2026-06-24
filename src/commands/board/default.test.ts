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
const gqlModulePath = resolve(repoRoot, "src/gql/board/board.ts");

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const setDefaultDashboardFn = mock((_config: unknown, _vars: unknown) =>
  Promise.resolve(),
);
const clearDefaultDashboardFn = mock((_config: unknown, _vars: unknown) =>
  Promise.resolve(),
);

let setDefault: (typeof import("./set-default"))["setDefault"];
let clearDefault: (typeof import("./clear-default"))["clearDefault"];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

const setDeps = {
  loadConfig: loadConfigFn,
  setDefaultDashboard: setDefaultDashboardFn,
} as Parameters<(typeof import("./set-default"))["setDefault"]>[3];

const clearDeps = {
  loadConfig: loadConfigFn,
  clearDefaultDashboard: clearDefaultDashboardFn,
} as Parameters<(typeof import("./clear-default"))["clearDefault"]>[2];

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  void mock.module(gqlModulePath, () => ({
    setDefaultDashboard: setDefaultDashboardFn,
    clearDefaultDashboard: clearDefaultDashboardFn,
    saveBoard: mock(() => Promise.resolve({})),
    getBoard: mock(() => Promise.resolve({})),
    searchBoards: mock(() => Promise.resolve([])),
    deleteBoard: mock(() => Promise.resolve()),
  }));

  setDefault = (await import("./set-default.ts")).setDefault;
  clearDefault = (await import("./clear-default.ts")).clearDefault;
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

describe("board set-default", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    setDefaultDashboardFn.mockClear();
  });

  test("prints success and passes dsid/dashid", async () => {
    const { context, stdout } = createMockContext();
    await setDefault.call(context, {}, "ds-100", "board-200", setDeps);

    expect(setDefaultDashboardFn).toHaveBeenCalledTimes(1);
    const [, vars] = setDefaultDashboardFn.mock.calls[0]!;
    expect(vars).toEqual({ dsid: "ds-100", dashid: "board-200" });
    expect(stdout.join("")).toContain("Default dashboard set successfully");
  });

  test("exits with code 1 when the mutation throws", async () => {
    setDefaultDashboardFn.mockImplementationOnce(() => {
      throw new Error("dataset not found");
    });
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await setDefault.call(context, {}, "invalid-ds", "board-200", setDeps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("dataset not found");
  });
});

describe("board clear-default", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    clearDefaultDashboardFn.mockClear();
  });

  test("prints success and passes dsid", async () => {
    const { context, stdout } = createMockContext();
    await clearDefault.call(context, {}, "ds-100", clearDeps);

    expect(clearDefaultDashboardFn).toHaveBeenCalledTimes(1);
    const [, vars] = clearDefaultDashboardFn.mock.calls[0]!;
    expect(vars).toEqual({ dsid: "ds-100" });
    expect(stdout.join("")).toContain("Default dashboard cleared successfully");
  });

  test("exits with code 1 when the mutation throws", async () => {
    clearDefaultDashboardFn.mockImplementationOnce(() => {
      throw new Error("permission denied");
    });
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await clearDefault.call(context, {}, "invalid-ds", clearDeps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("permission denied");
  });
});
