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
const gqlModulePath = resolve(repoRoot, "src/gql/board/board.ts");

const loadConfigFn = mock(() => ({
  customerId: "109601619518",
  token: "test-token",
  domain: "observeinc.com",
}));

const saveBoardFn = mock((_config: unknown, _vars: unknown) =>
  Promise.resolve({
    id: "42000001",
    name: "My Board",
    workspaceId: "42379913",
    folderId: "42379919",
    visibility: "Listed",
  }),
);

const readBoardInputFn = mock((_file: string) => ({
  name: "My Board",
  workspaceId: "42379913",
  layout: {},
}));

let create: (typeof import("./create"))["create"];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

const deps = {
  loadConfig: loadConfigFn,
  saveBoard: saveBoardFn,
  readBoardInput: readBoardInputFn,
} as Parameters<(typeof import("./create"))["create"]>[2];

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  void mock.module(gqlModulePath, () => ({
    saveBoard: saveBoardFn,
    getBoard: mock(() => Promise.resolve({})),
    searchBoards: mock(() => Promise.resolve([])),
    deleteBoard: mock(() => Promise.resolve()),
    setDefaultDashboard: mock(() => Promise.resolve()),
    clearDefaultDashboard: mock(() => Promise.resolve()),
  }));

  const mod = await import("./create.ts");
  create = mod.create;
});

afterAll(() => {
  mock.restore();
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

describe("board create", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    saveBoardFn.mockClear();
    readBoardInputFn.mockClear();
  });

  test("prints created name/id, visibility, and view URL", async () => {
    const { context, stdout } = createMockContext();
    await create.call(context, {}, "board.json", deps);

    expect(saveBoardFn).toHaveBeenCalledTimes(1);
    const out = stdout.join("");
    expect(out).toContain("Created: My Board (id: 42000001)");
    expect(out).toContain("Visibility: Listed");
    expect(out).toContain(
      "View: https://109601619518.observeinc.com/workspace/42379913/dashboard/42000001",
    );
  });

  test("passes the parsed input under the input variable", async () => {
    const { context } = createMockContext();
    await create.call(context, {}, "board.json", deps);
    const [, vars] = saveBoardFn.mock.calls[0]!;
    expect(vars).toEqual({
      input: { name: "My Board", workspaceId: "42379913", layout: {} },
    });
  });

  test("exits with code 1 on API error", async () => {
    saveBoardFn.mockImplementationOnce(() => {
      const err = new Error("Server error");
      err.name = "GqlApiError";
      (err as unknown as { statusCode: number }).statusCode = 500;
      throw err;
    });

    const { context, stderr, getExitCode } = createMockContext();
    try {
      await create.call(context, {}, "board.json", deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("Error");
  });
});
