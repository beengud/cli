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

const readInputFn = mock((_path: string) => ({
  name: "m",
  ruleKind: "Count",
  definition: {},
}));

const previewFn = mock(
  (_config: unknown, _input: unknown, _params: unknown, _ws?: string) =>
    Promise.resolve({
      stabilityBookmarkTime: "2024-01-02T00:00:00Z",
      alarms: [
        {
          id: "a-1",
          level: "Critical",
          start: "2024-01-01T00:00:00Z",
          end: null,
          isActive: true,
          capturedValues: [],
          context: [
            {
              value: "us-east-1",
              column: {
                columnPath: { name: "region", path: null },
                linkColumn: null,
              },
            },
          ],
        },
      ],
    }),
);

const fixedNow = () => new Date("2024-01-02T00:00:00Z");

const deps = {
  loadConfig: loadConfigFn,
  previewMonitor: previewFn,
  readMonitorInput: readInputFn,
  now: fixedNow,
} as unknown as Parameters<(typeof import("./preview"))["preview"]>[2];

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

describe("monitor preview", () => {
  let preview: (typeof import("./preview"))["preview"];

  beforeAll(async () => {
    preview = (await import("./preview")).preview;
  });

  beforeEach(() => {
    loadConfigFn.mockClear();
    readInputFn.mockClear();
    previewFn.mockClear();
  });

  test("prints Would fire: true and sample groupings", async () => {
    const { context, stdout } = createMockContext();
    await preview.call(context, { since: 3_600_000 }, "in.json", deps);
    const out = stdout.join("");
    expect(out).toContain("Would fire: true");
    expect(out).toContain("region=us-east-1");
  });

  test("computes params time window from since + now and forwards workspace", async () => {
    const { context } = createMockContext();
    await preview.call(
      context,
      { since: 3_600_000, workspace: "ws-1" },
      "in.json",
      deps,
    );
    const [, , params, ws] = previewFn.mock.calls[0]!;
    expect(ws).toBe("ws-1");
    expect(params).toEqual({
      startTime: "2024-01-01T23:00:00.000Z",
      endTime: "2024-01-02T00:00:00.000Z",
    });
  });

  test("Would fire: false when no alarms", async () => {
    previewFn.mockImplementationOnce(() =>
      Promise.resolve({ stabilityBookmarkTime: "x", alarms: [] }),
    );
    const { context, stdout } = createMockContext();
    await preview.call(context, { since: 3_600_000 }, "in.json", deps);
    expect(stdout.join("")).toContain("Would fire: false");
  });

  test("exits 1 when input file cannot be read", async () => {
    readInputFn.mockImplementationOnce(() => {
      throw new Error("could not read file");
    });
    const { context, getExitCode } = createMockContext();
    try {
      await preview.call(context, { since: 3_600_000 }, "missing.json", deps);
      throw new Error("expected exit");
    } catch (e) {
      expect((e as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
  });
});
