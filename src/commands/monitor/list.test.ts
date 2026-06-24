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

const searchMonitorsFn = mock((_config: unknown, _variables: unknown) =>
  Promise.resolve([
    {
      id: "mon-1",
      name: "CPU high",
      description: "",
      disabled: false,
      updatedDate: "2024-01-01T00:00:00Z",
    },
    {
      id: "mon-2",
      name: "Disk full",
      description: "",
      disabled: true,
      updatedDate: "2024-01-02T00:00:00Z",
    },
  ]),
);

const deps = {
  loadConfig: loadConfigFn,
  searchMonitors: searchMonitorsFn,
} as unknown as Parameters<(typeof import("./list"))["list"]>[2];

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

describe("monitor list", () => {
  let list: (typeof import("./list"))["list"];

  beforeAll(async () => {
    list = (await import("./list")).list;
  });

  beforeEach(() => {
    loadConfigFn.mockClear();
    searchMonitorsFn.mockClear();
  });

  test("outputs JSON of monitors", async () => {
    const { context, stdout } = createMockContext();
    await list.call(context, { json: true }, undefined, deps);

    expect(searchMonitorsFn).toHaveBeenCalledTimes(1);
    const output = JSON.parse(stdout.join(""));
    expect(output).toHaveLength(2);
    expect(output[0].name).toBe("CPU high");
  });

  test("passes name substring and workspace as variables", async () => {
    const { context } = createMockContext();
    await list.call(context, { json: true, workspace: "ws-1" }, "cpu", deps);

    const [, variables] = searchMonitorsFn.mock.calls[0]!;
    expect(variables).toEqual({ workspaceId: "ws-1", nameSubstring: "cpu" });
  });

  test("renders a table by default", async () => {
    const { context, stdout } = createMockContext();
    await list.call(context, {}, undefined, deps);
    const out = stdout.join("");
    expect(out).toContain("CPU high");
    expect(out).toContain("ID");
  });

  test("exits 1 on API error", async () => {
    searchMonitorsFn.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const { context, getExitCode, stderr } = createMockContext();
    try {
      await list.call(context, {}, undefined, deps);
      throw new Error("expected exit");
    } catch (e) {
      expect((e as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("Error");
  });
});
