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

const evaluateFn = mock((_config: unknown, _input: unknown) =>
  Promise.resolve({
    query: {
      outputStage: "stage-1",
      stages: [
        { id: "stage-0", pipeline: "filter true" },
        { id: "stage-1", pipeline: "statsby count: count()" },
      ],
    },
  }),
);

const deps = {
  loadConfig: loadConfigFn,
  evaluateMonitorSource: evaluateFn,
  readMonitorInput: readInputFn,
} as unknown as Parameters<
  (typeof import("./preview-query"))["previewQuery"]
>[2];

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

describe("monitor preview-query", () => {
  let previewQuery: (typeof import("./preview-query"))["previewQuery"];

  beforeAll(async () => {
    previewQuery = (await import("./preview-query")).previewQuery;
  });

  beforeEach(() => {
    loadConfigFn.mockClear();
    readInputFn.mockClear();
    evaluateFn.mockClear();
  });

  test("prints output stage and joined pipeline", async () => {
    const { context, stdout } = createMockContext();
    await previewQuery.call(context, {}, "in.json", deps);
    const out = stdout.join("");
    expect(out).toContain("Output stage: stage-1");
    expect(out).toContain("statsby count: count()");
    expect(out).toContain("// stage stage-0");
  });

  test("emits raw evaluation as JSON", async () => {
    const { context, stdout } = createMockContext();
    await previewQuery.call(context, { json: true }, "in.json", deps);
    const output = JSON.parse(stdout.join(""));
    expect(output.query.outputStage).toBe("stage-1");
  });

  test("exits 1 on API error", async () => {
    evaluateFn.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const { context, getExitCode } = createMockContext();
    try {
      await previewQuery.call(context, {}, "in.json", deps);
      throw new Error("expected exit");
    } catch (e) {
      expect((e as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
  });
});
