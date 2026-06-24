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
  "src/gql/worksheet/delete-worksheet.ts",
);

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const deleteWorksheetFn = mock((_config: unknown, _variables: unknown) =>
  Promise.resolve({ success: true, errorMessage: "" }),
);

let deleteWorksheetCommand: (typeof import("./delete"))["deleteWorksheetCommand"];

const deps = {
  loadConfig: loadConfigFn,
} as Parameters<
  (typeof import("./delete"))["deleteWorksheetCommand"]
>[3];

beforeAll(async () => {
  void mock.module(gqlModulePath, () => ({
    deleteWorksheet: deleteWorksheetFn,
  }));
  const mod = await import("./delete.ts");
  deleteWorksheetCommand = mod.deleteWorksheetCommand;
});

afterAll(() => {
  mock.restore();
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

describe("worksheet delete", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    deleteWorksheetFn.mockClear();
  });

  test("deletes and prints confirmation", async () => {
    const { context, stdout } = createMockContext();
    await deleteWorksheetCommand.call(context, {}, "ws-1", deps);

    expect(deleteWorksheetFn).toHaveBeenCalledTimes(1);
    const [, variables] = deleteWorksheetFn.mock.calls[0]!;
    expect(variables).toEqual({ id: "ws-1" });
    expect(stdout.join("")).toContain("Deleted worksheet ws-1");
  });

  test("exits 1 when the API reports failure", async () => {
    deleteWorksheetFn.mockImplementationOnce(() =>
      Promise.resolve({ success: false, errorMessage: "in use" }),
    );
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await deleteWorksheetCommand.call(context, {}, "ws-1", deps);
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("in use");
  });
});
