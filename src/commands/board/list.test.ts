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
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const searchBoardsFn = mock((_config: unknown, _vars: unknown) =>
  Promise.resolve([
    {
      score: "1",
      dashboard: {
        id: "d1",
        name: "Dash A",
        workspaceId: "ws1",
        updatedDate: "2026-01-01",
      },
    },
  ]),
);

let list: (typeof import("./list"))["list"];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

const deps = {
  loadConfig: loadConfigFn,
  searchBoards: searchBoardsFn,
} as Parameters<(typeof import("./list"))["list"]>[1];

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  void mock.module(gqlModulePath, () => ({
    searchBoards: searchBoardsFn,
    saveBoard: mock(() => Promise.resolve({})),
    getBoard: mock(() => Promise.resolve({})),
    deleteBoard: mock(() => Promise.resolve()),
    setDefaultDashboard: mock(() => Promise.resolve()),
    clearDefaultDashboard: mock(() => Promise.resolve()),
  }));

  list = (await import("./list.ts")).list;
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

describe("board list", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    searchBoardsFn.mockClear();
  });

  test("unwraps dashboards from search results", async () => {
    const { context, stdout } = createMockContext();
    await list.call(context, {}, deps);

    expect(searchBoardsFn).toHaveBeenCalledTimes(1);
    const output = JSON.parse(stdout.join(""));
    expect(output).toHaveLength(1);
    expect(output[0].id).toBe("d1");
    expect(output[0].name).toBe("Dash A");
  });

  test("maps name/workspace/folder flags into list-typed search terms", async () => {
    const { context } = createMockContext();
    await list.call(
      context,
      { name: "Dash", workspace: "ws1", folder: "f1" },
      deps,
    );
    const [, vars] = searchBoardsFn.mock.calls[0]!;
    expect(vars).toEqual({
      terms: { name: ["Dash"], workspaceId: ["ws1"], folderId: ["f1"] },
    });
  });

  test("sends empty terms when no filters are set", async () => {
    const { context } = createMockContext();
    await list.call(context, {}, deps);
    const [, vars] = searchBoardsFn.mock.calls[0]!;
    expect(vars).toEqual({ terms: {} });
  });
});
