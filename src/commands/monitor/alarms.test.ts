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
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const searchAlarmsFn = mock((_config: unknown, _variables: unknown) =>
  Promise.resolve([
    {
      id: "alarm-1",
      level: "Critical",
      isActive: true,
      start: "2024-01-01T00:00:00Z",
      end: null,
      detectedStart: "2024-01-01T00:00:00Z",
      detectedEnd: null,
      monitor: { id: "mon-1", name: "CPU high" },
    },
    {
      id: "alarm-2",
      level: "Warning",
      isActive: false,
      start: "2024-01-01T00:00:00Z",
      end: "2024-01-01T01:00:00Z",
      detectedStart: "2024-01-01T00:00:00Z",
      detectedEnd: "2024-01-01T01:00:00Z",
      monitor: { id: "mon-2", name: "Disk" },
    },
  ]),
);

const fixedNow = () => new Date("2024-01-02T00:00:00Z");

const deps = {
  loadConfig: loadConfigFn,
  searchMonitorAlarms: searchAlarmsFn,
  now: fixedNow,
} as unknown as Parameters<(typeof import("./alarms"))["alarms"]>[1];

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

describe("monitor alarms", () => {
  let alarms: (typeof import("./alarms"))["alarms"];

  beforeAll(async () => {
    alarms = (await import("./alarms")).alarms;
  });

  beforeEach(() => {
    loadConfigFn.mockClear();
    searchAlarmsFn.mockClear();
  });

  test("projects rows with derived monitorId/status/startTime/endTime (JSON)", async () => {
    const { context, stdout } = createMockContext();
    await alarms.call(context, { json: true, since: 86_400_000 }, deps);

    const output = JSON.parse(stdout.join(""));
    expect(output).toHaveLength(2);
    expect(output[0]).toEqual({
      id: "alarm-1",
      monitorId: "mon-1",
      level: "Critical",
      status: "Active",
      startTime: "2024-01-01T00:00:00Z",
      endTime: null,
    });
    expect(output[1].status).toBe("Ended");
  });

  test("computes minTime from since and forwards monitorId + level", async () => {
    const { context } = createMockContext();
    await alarms.call(
      context,
      { json: true, since: 86_400_000, monitorId: "mon-9", level: "Critical" },
      deps,
    );
    const [, variables] = searchAlarmsFn.mock.calls[0]!;
    expect(variables).toMatchObject({
      monitorIds: ["mon-9"],
      levels: ["Critical"],
      minTime: "2024-01-01T00:00:00.000Z",
    });
  });

  test("warns when no alarms (table mode)", async () => {
    searchAlarmsFn.mockImplementationOnce(() => Promise.resolve([]));
    const { context, stdout } = createMockContext();
    await alarms.call(context, { since: 86_400_000 }, deps);
    expect(stdout.join("")).toContain("No alarms found");
  });

  test("exits 1 on error", async () => {
    searchAlarmsFn.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const { context, getExitCode } = createMockContext();
    try {
      await alarms.call(context, { since: 86_400_000 }, deps);
      throw new Error("expected exit");
    } catch (e) {
      expect((e as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
  });
});
