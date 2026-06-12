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
  "src/gql/datastream/list-datastreams.ts",
);

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const listDatastreamsFn = mock((_config: unknown, _variables: unknown) =>
  Promise.resolve([
    {
      id: "ds-1",
      name: "Stream A",
      description: "",
      disabled: false,
      directWrite: null,
    },
    {
      id: "ds-2",
      name: "Stream B",
      description: "",
      disabled: false,
      directWrite: { otelLogs: { datasetId: "d-1" } },
    },
  ]),
);

let list: (typeof import("./list"))["list"];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

const deps = {
  loadConfig: loadConfigFn,
} as Parameters<(typeof import("./list"))["list"]>[1];

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  void mock.module(gqlModulePath, () => ({
    listDatastreams: listDatastreamsFn,
  }));

  const mod = await import("./list.ts");
  list = mod.list;
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

describe("datastream list", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    listDatastreamsFn.mockClear();
  });

  test("calls listDatastreams and outputs array", async () => {
    const { context, stdout } = createMockContext();
    await list.call(context, {}, deps);

    expect(listDatastreamsFn).toHaveBeenCalledTimes(1);
    const output = JSON.parse(stdout.join(""));
    expect(output).toHaveLength(2);
    expect(output[0].name).toBe("Stream A");
  });

  test("filters by name substring (case-insensitive) client-side", async () => {
    const { context, stdout } = createMockContext();
    await list.call(context, { match: "stream a" }, deps);

    const [, variables] = listDatastreamsFn.mock.calls[0]!;
    expect(variables).toBeUndefined();
    const output = JSON.parse(stdout.join(""));
    expect(output).toHaveLength(1);
    expect(output[0].name).toBe("Stream A");
  });

  test("returns empty array when name matches nothing", async () => {
    const { context, stdout } = createMockContext();
    await list.call(context, { match: "nonexistent" }, deps);

    const output = JSON.parse(stdout.join(""));
    expect(output).toEqual([]);
  });

  test("exits with code 1 on API error", async () => {
    listDatastreamsFn.mockImplementationOnce(() => {
      const err = new Error("Server error");
      err.name = "GqlApiError";
      (err as unknown as { statusCode: number }).statusCode = 500;
      throw err;
    });

    const { context, stderr, getExitCode } = createMockContext();
    try {
      await list.call(context, {}, deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("Error");
  });
});
