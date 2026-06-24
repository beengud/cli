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
const gqlModulePath = resolve(repoRoot, "src/gql/worksheet/save-worksheet.ts");

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const saveWorksheetFn = mock((_config: unknown, _variables: unknown) =>
  Promise.resolve({ id: "ws-9", name: "New Sheet", workspaceId: "41000001" }),
);

let create: (typeof import("./create"))["create"];

beforeAll(async () => {
  void mock.module(gqlModulePath, () => ({
    saveWorksheet: saveWorksheetFn,
  }));
  const mod = await import("./create.ts");
  create = mod.create;
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

function depsWith(fileContents: string) {
  return {
    loadConfig: loadConfigFn,
    readFile: () => fileContents,
  } as Parameters<(typeof import("./create"))["create"]>[3];
}

describe("worksheet create", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    saveWorksheetFn.mockClear();
  });

  test("reads file, strips read-only fields, and saves", async () => {
    const { context, stdout } = createMockContext();
    const file = JSON.stringify({
      name: "New Sheet",
      workspaceId: "41000001",
      stages: [{ id: "s0", pipeline: "filter true" }],
      updatedDate: "should-be-stripped",
    });
    await create.call(context, {}, "ws.json", depsWith(file));

    expect(saveWorksheetFn).toHaveBeenCalledTimes(1);
    const [, variables] = saveWorksheetFn.mock.calls[0]!;
    const wks = (variables as { wks: Record<string, unknown> }).wks;
    expect(wks.updatedDate).toBeUndefined();
    expect(wks.name).toBe("New Sheet");
    expect(stdout.join("")).toContain("Created: New Sheet (id: ws-9)");
  });

  test("--workspace overrides the file's workspaceId", async () => {
    const { context } = createMockContext();
    const file = JSON.stringify({
      name: "New Sheet",
      workspaceId: "old",
      stages: [{ id: "s0", pipeline: "filter true" }],
    });
    await create.call(context, { workspace: "99" }, "ws.json", depsWith(file));

    const [, variables] = saveWorksheetFn.mock.calls[0]!;
    const wks = (variables as { wks: Record<string, unknown> }).wks;
    expect(wks.workspaceId).toBe("99");
  });

  test("exits 1 when required fields missing", async () => {
    const { context, stderr, getExitCode } = createMockContext();
    const file = JSON.stringify({ name: "No stages", workspaceId: "1" });
    try {
      await create.call(context, {}, "ws.json", depsWith(file));
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("stages");
    expect(saveWorksheetFn).not.toHaveBeenCalled();
  });

  test("exits 1 on invalid JSON", async () => {
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await create.call(context, {}, "ws.json", depsWith("{not json"));
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("could not parse JSON");
  });
});
