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
  "src/gql/datastream/update-datastream.ts",
);

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const updateDatastreamFn = mock((_config: unknown, _variables: unknown) =>
  Promise.resolve({
    id: "ds-123",
    name: "Updated Name",
    description: "Updated desc",
    disabled: false,
    directWrite: null,
  }),
);

const viewDatastreamFn = mock((_config: unknown, _variables: unknown) =>
  Promise.resolve({
    id: "ds-123",
    name: "Existing Name",
    description: "Existing desc",
    disabled: false,
    directWrite: null,
    stats: null,
  }),
);

let update: (typeof import("./update"))["update"];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

const deps = {
  loadConfig: loadConfigFn,
  viewDatastream: viewDatastreamFn,
} as Parameters<(typeof import("./update"))["update"]>[2];

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  void mock.module(gqlModulePath, () => ({
    updateDatastream: updateDatastreamFn,
  }));

  const mod = await import("./update.ts");
  update = mod.update;
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

describe("datastream update", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    updateDatastreamFn.mockClear();
    viewDatastreamFn.mockClear();
  });

  test("passes provided name without fetching current datastream", async () => {
    const { context, stdout } = createMockContext();
    await update.call(context, { name: "Updated Name" }, "ds-123", deps);

    expect(viewDatastreamFn).not.toHaveBeenCalled();
    expect(updateDatastreamFn).toHaveBeenCalledTimes(1);
    const [, variables] = updateDatastreamFn.mock.calls[0]!;
    expect(variables).toMatchObject({
      id: "ds-123",
      datastream: { name: "Updated Name" },
    });

    const output = JSON.parse(stdout.join(""));
    expect(output.id).toBe("ds-123");
  });

  test("backfills current name when --name is omitted", async () => {
    const { context } = createMockContext();
    await update.call(context, { description: "Only desc" }, "ds-123", deps);

    expect(viewDatastreamFn).toHaveBeenCalledTimes(1);
    const [, variables] = updateDatastreamFn.mock.calls[0]!;
    expect(variables).toMatchObject({
      id: "ds-123",
      datastream: { name: "Existing Name", description: "Only desc" },
    });
  });

  test("exits with code 1 when no editable field is provided", async () => {
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await update.call(context, {}, "ds-123", deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("Nothing to update");
    expect(viewDatastreamFn).not.toHaveBeenCalled();
    expect(updateDatastreamFn).not.toHaveBeenCalled();
  });

  test("exits with code 1 on API error", async () => {
    updateDatastreamFn.mockImplementationOnce(() => {
      const err = new Error("Permission denied");
      err.name = "GqlApiError";
      (err as unknown as { statusCode: number }).statusCode = 403;
      throw err;
    });

    const { context, stderr, getExitCode } = createMockContext();
    try {
      await update.call(context, { name: "fail" }, "ds-123", deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("Error");
  });
});
