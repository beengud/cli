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
  "src/gql/datastream/create-datastream.ts",
);

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const createDatastreamFn = mock((_config: unknown, _variables: unknown) =>
  Promise.resolve({
    id: "ds-123",
    name: "Kubernetes Explorer/OpenTelemetry Logs",
    description: null,
    disabled: false,
    directWrite: {
      otelLogs: { datasetId: "dataset-456" },
      prometheus: null,
      otelMetrics: null,
      k8sEntity: null,
      otelTrace: null,
    },
  }),
);

let create: (typeof import("./create"))["create"];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

const deps = {
  loadConfig: loadConfigFn,
} as Parameters<(typeof import("./create"))["create"]>[1];

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  void mock.module(gqlModulePath, () => ({
    createDatastream: createDatastreamFn,
  }));

  const mod = await import("./create.ts");
  create = mod.create;
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

describe("datastream create", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    createDatastreamFn.mockClear();
  });

  test("calls createDatastream with correct variables for direct write otel logs", async () => {
    const { context, stdout } = createMockContext();
    await create.call(
      context,
      {
        name: "Kubernetes Explorer/OpenTelemetry Logs",
        directWriteOtelLogs: true,
      },
      deps,
    );

    expect(createDatastreamFn).toHaveBeenCalledTimes(1);
    const [, variables] = createDatastreamFn.mock.calls[0]!;
    expect(variables).toMatchObject({
      datastream: {
        name: "Kubernetes Explorer/OpenTelemetry Logs",
        directWrite: {
          otelLogs: true,
          prometheus: false,
          otelMetrics: false,
          k8sEntity: false,
          otelTrace: false,
        },
      },
    });

    const output = JSON.parse(stdout.join(""));
    expect(output.id).toBe("ds-123");
    expect(output.directWrite.otelLogs.datasetId).toBe("dataset-456");
  });

  test("omits directWrite when no direct write flags are set", async () => {
    const { context } = createMockContext();
    await create.call(
      context,
      {
        name: "plain-stream",
      },
      deps,
    );

    const [, variables] = createDatastreamFn.mock.calls[0]!;
    expect(variables).toMatchObject({
      datastream: {
        name: "plain-stream",
      },
    });
    expect(
      (variables as { datastream: Record<string, unknown> }).datastream
        .directWrite,
    ).toBeUndefined();
  });

  test("exits with code 1 on API error", async () => {
    createDatastreamFn.mockImplementationOnce(() => {
      const err = new Error("Permission denied");
      err.name = "GqlApiError";
      (err as unknown as { statusCode: number }).statusCode = 403;
      throw err;
    });

    const { context, stderr, getExitCode } = createMockContext();
    try {
      await create.call(context, { name: "fail-stream" }, deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("Error");
  });
});
