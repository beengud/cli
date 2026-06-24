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
const gqlModulePath = resolve(repoRoot, "src/gql/opal/verbs-and-functions.ts");

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const verbsAndFunctionsFn = mock((_config: unknown) =>
  Promise.resolve({
    verbs: [],
    functions: [
      {
        name: "sum",
        description: "Sum values",
        categories: ["Aggregation"],
        returnType: "float64",
      },
      {
        name: "count",
        description: "Count rows",
        categories: ["Aggregation"],
        returnType: "int64",
      },
      {
        name: "avg",
        description: "Average values",
        categories: ["Aggregation"],
        returnType: "float64",
      },
    ],
  }),
);

let functions: (typeof import("./functions"))["functions"];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

const deps = {
  loadConfig: loadConfigFn,
  verbsAndFunctions: verbsAndFunctionsFn,
} as Parameters<(typeof import("./functions"))["functions"]>[1];

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  void mock.module(gqlModulePath, () => ({
    verbsAndFunctions: verbsAndFunctionsFn,
  }));

  const mod = await import("./functions.ts");
  functions = mod.functions;
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

describe("opal functions", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    verbsAndFunctionsFn.mockClear();
  });

  test("outputs TSV sorted by name including return type", async () => {
    const { context, stdout } = createMockContext();
    await functions.call(context, {}, deps);

    const lines = stdout.join("").trimEnd().split("\n");
    expect(lines).toEqual([
      "avg\tAggregation\tfloat64\tAverage values",
      "count\tAggregation\tint64\tCount rows",
      "sum\tAggregation\tfloat64\tSum values",
    ]);
  });

  test("supports --format json", async () => {
    const { context, stdout } = createMockContext();
    await functions.call(context, { format: "json" }, deps);
    const out = JSON.parse(stdout.join(""));
    expect(out[0]).toEqual({
      name: "avg",
      categories: "Aggregation",
      returnType: "float64",
      description: "Average values",
    });
  });

  test("exits 1 on API error", async () => {
    verbsAndFunctionsFn.mockImplementationOnce(() => {
      const err = new Error("Server error");
      err.name = "GqlApiError";
      (err as unknown as { statusCode: number }).statusCode = 500;
      throw err;
    });

    const { context, stderr, getExitCode } = createMockContext();
    try {
      await functions.call(context, {}, deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("Error");
  });
});
