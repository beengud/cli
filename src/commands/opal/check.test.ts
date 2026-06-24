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
const gqlModulePath = resolve(repoRoot, "src/gql/opal/check-queries.ts");

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const checkQueriesFn = mock((_config: unknown, _variables: unknown) =>
  Promise.resolve<unknown>({
    parsedPipeline: { errors: [], warnings: [] },
    resultSchema: { fieldList: [{ name: "timestamp" }, { name: "log" }] },
  }),
);

let check: (typeof import("./check"))["check"];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

const deps = {
  loadConfig: loadConfigFn,
  checkQueries: checkQueriesFn,
} as Parameters<(typeof import("./check"))["check"]>[2];

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  void mock.module(gqlModulePath, () => ({
    checkQueries: checkQueriesFn,
  }));

  const mod = await import("./check.ts");
  check = mod.check;
});

afterAll(() => {
  mock.restore();
  if (previousNoColor === undefined) {
    delete process.env.NO_COLOR;
  } else {
    process.env.NO_COLOR = previousNoColor;
  }
  if (previousForceColor === undefined) {
    delete process.env.FORCE_COLOR;
  } else {
    process.env.FORCE_COLOR = previousForceColor;
  }
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

describe("opal check", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    checkQueriesFn.mockClear();
  });

  test("prints OK and schema fields on success", async () => {
    const { context, stdout } = createMockContext();
    await check.call(context, {}, "filter true", deps);

    expect(checkQueriesFn).toHaveBeenCalledTimes(1);
    const [, variables] = checkQueriesFn.mock.calls[0]!;
    expect(variables).toEqual({
      queries: {
        outputStage: "stage-1",
        stages: [{ id: "stage-1", pipeline: "filter true", input: [] }],
      },
    });
    const out = stdout.join("");
    expect(out).toContain("OK");
    expect(out).toContain("timestamp");
    expect(out).toContain("log");
  });

  test("prints ERROR row:col: text and exits 1 on errors", async () => {
    checkQueriesFn.mockImplementationOnce(() =>
      Promise.resolve<unknown>({
        parsedPipeline: {
          errors: [{ col: "1", row: "2", text: "not_a_verb" }],
          warnings: [],
        },
        resultSchema: null,
      }),
    );

    const { context, stdout, getExitCode } = createMockContext();
    try {
      await check.call(context, {}, "not_a_verb 123", deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    const out = stdout.join("");
    expect(out).toContain("ERROR 2:1: not_a_verb");
    expect(out).not.toContain("OK");
  });

  test("treats empty-text errors as OK (compilation requires input dataset)", async () => {
    checkQueriesFn.mockImplementationOnce(() =>
      Promise.resolve<unknown>({
        parsedPipeline: {
          errors: [{ col: "0", row: "0", text: "" }],
          warnings: [],
        },
        resultSchema: { fieldList: [] },
      }),
    );

    const { context, stdout } = createMockContext();
    await check.call(context, {}, "filter true", deps);
    expect(stdout.join("")).toContain("OK");
  });

  test("prints WARN kind row:col then OK on warnings only", async () => {
    checkQueriesFn.mockImplementationOnce(() =>
      Promise.resolve<unknown>({
        parsedPipeline: {
          errors: [],
          warnings: [{ kind: "deprecation", symbol: { col: "3", row: "4" } }],
        },
        resultSchema: { fieldList: [] },
      }),
    );

    const { context, stdout } = createMockContext();
    await check.call(context, {}, "filter true", deps);
    const out = stdout.join("");
    expect(out).toContain("WARN deprecation 4:3");
    expect(out).toContain("OK");
  });

  test("reads pipeline from --file", async () => {
    const readFile = mock(() => "filter true");
    const { context, stdout } = createMockContext();
    await check.call(context, { file: "/tmp/p.opal" }, undefined, {
      ...deps,
      readFile,
    });

    expect(readFile).toHaveBeenCalledWith("/tmp/p.opal");
    const [, variables] = checkQueriesFn.mock.calls[0]!;
    expect(
      (variables as { queries: { stages: { pipeline: string }[] } }).queries
        .stages[0]!.pipeline,
    ).toBe("filter true");
    expect(stdout.join("")).toContain("OK");
  });

  test("exits 1 with usage error when no pipeline and no file", async () => {
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await check.call(context, {}, undefined, deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("usage:");
    expect(checkQueriesFn).not.toHaveBeenCalled();
  });

  test("exits 1 when --file cannot be read", async () => {
    const readFile = mock(() => {
      throw new Error("ENOENT");
    });
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await check.call(context, { file: "/nope" }, undefined, {
        ...deps,
        readFile,
      });
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("could not read file");
    expect(checkQueriesFn).not.toHaveBeenCalled();
  });

  test("exits 1 on API error", async () => {
    checkQueriesFn.mockImplementationOnce(() => {
      const err = new Error("Server error");
      err.name = "GqlApiError";
      (err as unknown as { statusCode: number }).statusCode = 500;
      throw err;
    });

    const { context, stderr, getExitCode } = createMockContext();
    try {
      await check.call(context, {}, "filter true", deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("Error");
  });
});
