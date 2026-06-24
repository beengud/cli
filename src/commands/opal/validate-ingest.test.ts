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
const gqlModulePath = resolve(
  repoRoot,
  "src/gql/opal/validate-ingest-filter.ts",
);

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const validateIngestFilterFn = mock(
  (_config: unknown, _variables: unknown) =>
    Promise.resolve<unknown>(null) as Promise<unknown>,
);

let validateIngest: (typeof import("./validate-ingest"))["validateIngest"];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

const deps = {
  loadConfig: loadConfigFn,
  validateIngestFilter: validateIngestFilterFn,
} as Parameters<(typeof import("./validate-ingest"))["validateIngest"]>[2];

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  void mock.module(gqlModulePath, () => ({
    validateIngestFilter: validateIngestFilterFn,
  }));

  const mod = await import("./validate-ingest.ts");
  validateIngest = mod.validateIngest;
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

describe("opal validate-ingest", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    validateIngestFilterFn.mockClear();
  });

  test("prints OK on null (valid) response", async () => {
    const { context, stdout } = createMockContext();
    await validateIngest.call(
      context,
      { dataset: "42918275" },
      "filter true",
      deps,
    );

    const [, variables] = validateIngestFilterFn.mock.calls[0]!;
    expect(variables).toEqual({
      pipeline: "filter true",
      sourceDatasetID: "42918275",
    });
    expect(stdout.join("")).toContain("OK");
  });

  test("prints OK on empty array response", async () => {
    validateIngestFilterFn.mockImplementationOnce(() => Promise.resolve([]));
    const { context, stdout } = createMockContext();
    await validateIngest.call(
      context,
      { dataset: "42918275" },
      "filter true",
      deps,
    );
    expect(stdout.join("")).toContain("OK");
  });

  test("prints ERROR: message and exits 1 on diagnostics", async () => {
    validateIngestFilterFn.mockImplementationOnce(() =>
      Promise.resolve([{ message: '1,1: unknown verb "bad_filter"' }]),
    );

    const { context, stdout, getExitCode } = createMockContext();
    try {
      await validateIngest.call(
        context,
        { dataset: "42918275" },
        "bad_filter",
        deps,
      );
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    const out = stdout.join("");
    expect(out).toContain('ERROR: 1,1: unknown verb "bad_filter"');
    expect(out).not.toContain("OK");
  });

  test("exits 1 on API error", async () => {
    validateIngestFilterFn.mockImplementationOnce(() => {
      const err = new Error("Server error");
      err.name = "GqlApiError";
      (err as unknown as { statusCode: number }).statusCode = 500;
      throw err;
    });

    const { context, stderr, getExitCode } = createMockContext();
    try {
      await validateIngest.call(
        context,
        { dataset: "42918275" },
        "filter true",
        deps,
      );
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("Error");
  });
});
