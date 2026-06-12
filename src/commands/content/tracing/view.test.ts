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
const gqlModulePath = resolve(
  repoRoot,
  "src/gql/content/view-tracing-content.ts",
);

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const getTracingContentFn = mock((_config: unknown) =>
  Promise.resolve({
    traceDatasetId: "trace-ds-1",
    spanRawDatasetId: "span-raw-1",
    spanEventDatasetId: "span-event-1",
    spanLinkDatasetId: "span-link-1",
    otelMetricsDatasetId: "otel-metrics-1",
  }),
);

let view: (typeof import("./view"))["view"];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

const deps = {
  loadConfig: loadConfigFn,
} as Parameters<(typeof import("./view"))["view"]>[0];

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  void mock.module(gqlModulePath, () => ({
    getTracingContent: getTracingContentFn,
  }));

  const mod = await import("./view.ts");
  view = mod.view;
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

describe("content tracing view", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    getTracingContentFn.mockClear();
  });

  test("outputs tracing content dataset IDs", async () => {
    const { context, stdout } = createMockContext();
    await view.call(context, deps);

    expect(getTracingContentFn).toHaveBeenCalledTimes(1);
    const output = JSON.parse(stdout.join(""));
    expect(output.traceDatasetId).toBe("trace-ds-1");
    expect(output.spanRawDatasetId).toBe("span-raw-1");
    expect(output.spanEventDatasetId).toBe("span-event-1");
    expect(output.spanLinkDatasetId).toBe("span-link-1");
    expect(output.otelMetricsDatasetId).toBe("otel-metrics-1");
  });

  test("outputs null when no tracing content is installed", async () => {
    getTracingContentFn.mockImplementationOnce(
      () => Promise.resolve(null) as never,
    );

    const { context, stdout } = createMockContext();
    await view.call(context, deps);

    const output = JSON.parse(stdout.join(""));
    expect(output).toBeNull();
  });

  test("exits with code 1 on API error", async () => {
    getTracingContentFn.mockImplementationOnce(() => {
      const err = new Error("Unauthorized");
      err.name = "GqlApiError";
      (err as unknown as { statusCode: number }).statusCode = 401;
      throw err;
    });

    const { context, stderr, getExitCode } = createMockContext();
    try {
      await view.call(context, deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("Error");
  });
});
