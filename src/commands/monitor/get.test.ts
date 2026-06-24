import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";
import type { LocalContext } from "../../context";
import { createWriter } from "../../lib/writer";

const loadConfigFn = mock(() => ({
  customerId: "c",
  token: "t",
  domain: "observeinc.com",
}));

const monitor = {
  id: "mon-1",
  workspaceId: "ws-1",
  name: "CPU high",
  description: "watch cpu",
  disabled: false,
  ruleKind: "Count",
  createdBy: "u-1",
  createdDate: "2024-01-01T00:00:00Z",
  updatedDate: "2024-01-02T00:00:00Z",
  definition: {
    lookbackTime: "1h",
    dataStabilizationDelay: null,
    maxAlertsPerHour: "100",
    inputQuery: {
      outputStage: "s1",
      stages: [{ id: "s1", pipeline: "filter true" }],
    },
    rules: [
      {
        level: "Critical",
        count: { compareValues: [] },
        threshold: null,
        promote: null,
        anomaly: null,
      },
    ],
    groupings: [
      { columnPath: { name: "region", path: null }, linkColumn: null },
    ],
  },
};

const getMonitorFn = mock((_config: unknown, _id: string) =>
  Promise.resolve(monitor),
);

const deps = {
  loadConfig: loadConfigFn,
  getMonitor: getMonitorFn,
} as unknown as Parameters<(typeof import("./get"))["get"]>[2];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

beforeAll(() => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";
});

afterAll(() => {
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

describe("monitor get", () => {
  let get: (typeof import("./get"))["get"];

  beforeAll(async () => {
    get = (await import("./get")).get;
  });

  beforeEach(() => {
    loadConfigFn.mockClear();
    getMonitorFn.mockClear();
  });

  test("outputs the full monitor (including definition) as JSON", async () => {
    const { context, stdout } = createMockContext();
    await get.call(context, { json: true }, "mon-1", deps);
    expect(getMonitorFn).toHaveBeenCalledWith(expect.anything(), "mon-1");
    const output = JSON.parse(stdout.join(""));
    expect(output.id).toBe("mon-1");
    expect(output.definition.rules[0].level).toBe("Critical");
  });

  test("renders a human summary by default", async () => {
    const { context, stdout } = createMockContext();
    await get.call(context, {}, "mon-1", deps);
    const out = stdout.join("");
    expect(out).toContain("Monitor mon-1");
    expect(out).toContain("CPU high");
  });

  test("exits 1 on error", async () => {
    getMonitorFn.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const { context, getExitCode } = createMockContext();
    try {
      await get.call(context, {}, "mon-1", deps);
      throw new Error("expected exit");
    } catch (e) {
      expect((e as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
  });
});
