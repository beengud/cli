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
  "src/gql/content/update-host-content.ts",
);

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const updateHostContentFn = mock((_config: unknown, _variables: unknown) =>
  Promise.resolve({
    otelLogsDatasetId: "logs-ds-1",
    prometheusDatasetId: "prom-ds-2",
    hostExplorerLogsDatasetId: "host-logs-ds-3",
  }),
);

let install: (typeof import("./install"))["install"];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

const deps = {
  loadConfig: loadConfigFn,
} as Parameters<(typeof import("./install"))["install"]>[1];

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  void mock.module(gqlModulePath, () => ({
    updateHostContent: updateHostContentFn,
  }));

  const mod = await import("./install.ts");
  install = mod.install;
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

  return {
    context,
    stdout,
    stderr,
    getExitCode: () => exitCode,
  };
}

describe("content host install", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    updateHostContentFn.mockClear();
  });

  test("passes dataset IDs to updateHostContent", async () => {
    const { context, stdout } = createMockContext();
    await install.call(
      context,
      {
        otelLogsDatasetId: "logs-ds-1",
        prometheusDatasetId: "prom-ds-2",
      },
      deps,
    );

    expect(updateHostContentFn).toHaveBeenCalledTimes(1);
    const [, variables] = updateHostContentFn.mock.calls[0]!;
    expect(variables).toMatchObject({
      input: {
        otelLogsDatasetId: "logs-ds-1",
        prometheusDatasetId: "prom-ds-2",
      },
    });

    const output = JSON.parse(stdout.join(""));
    expect(output.otelLogsDatasetId).toBe("logs-ds-1");
    expect(output.hostExplorerLogsDatasetId).toBe("host-logs-ds-3");
  });

  test("works with no dataset IDs (empty input)", async () => {
    const { context } = createMockContext();
    await install.call(context, {}, deps);

    expect(updateHostContentFn).toHaveBeenCalledTimes(1);
    const [, variables] = updateHostContentFn.mock.calls[0]!;
    expect(variables).toMatchObject({
      input: {},
    });
  });

  test("exits with code 1 on API error", async () => {
    updateHostContentFn.mockImplementationOnce(() => {
      const err = new Error("Unauthorized");
      err.name = "GqlApiError";
      (err as unknown as { statusCode: number }).statusCode = 401;
      throw err;
    });

    const { context, stderr, getExitCode } = createMockContext();
    try {
      await install.call(context, {}, deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("Error");
  });
});
