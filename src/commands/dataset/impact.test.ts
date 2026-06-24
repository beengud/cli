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
const affectedModulePath = resolve(
  repoRoot,
  "src/gql/dataset/datasets-affected-by-update.ts",
);
const dryRunModulePath = resolve(
  repoRoot,
  "src/gql/dataset/save-dataset-dry-run.ts",
);

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const readDatasetInputFn = mock((_file: string) => ({
  workspaceId: "42379913",
  dataset: { label: "MyDataset" },
  query: {
    outputStage: "main",
    stages: [{ id: "main", pipeline: "filter true", input: [] }],
  },
}));

const getAffectedFn = mock((_config: unknown, _variables: unknown) =>
  Promise.resolve({
    dematerializedDatasets: [
      { dataset: { id: "55001", name: "Alpha" } },
      { dataset: { id: "55002", name: "Beta" } },
    ],
    editForwardDematerializedDatasets: [],
  }),
);

const dryRunFn = mock((_config: unknown, _variables: unknown) =>
  Promise.resolve({
    dataset: { id: "99001", name: "MyDataset" },
    dematerializedDatasets: [],
    errorDatasets: [],
  }),
);

let impact: (typeof import("./impact"))["impact"];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

const deps = {
  loadConfig: loadConfigFn,
  readDatasetInput: readDatasetInputFn,
  getDatasetsAffectedByUpdate: getAffectedFn,
  saveDatasetDryRun: dryRunFn,
} as Parameters<(typeof import("./impact"))["impact"]>[3];

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  void mock.module(affectedModulePath, () => ({
    getDatasetsAffectedByUpdate: getAffectedFn,
  }));
  void mock.module(dryRunModulePath, () => ({
    saveDatasetDryRun: dryRunFn,
  }));

  const mod = await import("./impact.ts");
  impact = mod.impact;
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

describe("dataset impact", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    readDatasetInputFn.mockClear();
    getAffectedFn.mockClear();
    dryRunFn.mockClear();
    getAffectedFn.mockImplementation(() =>
      Promise.resolve({
        dematerializedDatasets: [
          { dataset: { id: "55001", name: "Alpha" } },
          { dataset: { id: "55002", name: "Beta" } },
        ],
        editForwardDematerializedDatasets: [],
      }),
    );
    dryRunFn.mockImplementation(() =>
      Promise.resolve({
        dataset: { id: "99001", name: "MyDataset" },
        dematerializedDatasets: [],
        errorDatasets: [],
      }),
    );
  });

  test("renders a table of affected datasets", async () => {
    const { context, stdout } = createMockContext();
    await impact.call(context, {}, "input.json", deps);

    const out = stdout.join("");
    expect(out).toContain("NAME");
    expect(out).toContain("ID");
    expect(out).toContain("IMPACT");
    expect(out).toContain("Alpha");
    expect(out).toContain("55001");
    expect(out).toContain("Beta");
    expect(out).toContain("dematerialized");
  });

  test("emits JSON rows with --json", async () => {
    const { context, stdout } = createMockContext();
    await impact.call(context, { json: true }, "input.json", deps);

    const rows = JSON.parse(stdout.join(""));
    expect(rows).toEqual([
      { name: "Alpha", id: "55001", impact: "dematerialized" },
      { name: "Beta", id: "55002", impact: "dematerialized" },
    ]);
  });

  test("writes error datasets to stderr", async () => {
    dryRunFn.mockImplementationOnce(() =>
      Promise.resolve({
        dataset: null,
        dematerializedDatasets: [],
        errorDatasets: [
          {
            datasetId: "66001",
            datasetName: "ErrorDs",
            text: "compilation failed",
          },
        ],
      }),
    );
    const { context, stderr } = createMockContext();
    await impact.call(context, {}, "input.json", deps);

    expect(stderr.join("")).toContain("Error in ErrorDs: compilation failed");
  });

  test("renders header even when no affected datasets", async () => {
    getAffectedFn.mockImplementationOnce(() =>
      Promise.resolve({
        dematerializedDatasets: [],
        editForwardDematerializedDatasets: [],
      }),
    );
    const { context, stdout } = createMockContext();
    await impact.call(context, {}, "input.json", deps);

    const out = stdout.join("");
    expect(out).toContain("NAME");
    expect(out).toContain("ID");
    expect(out).toContain("IMPACT");
  });

  test("exits 1 on API error", async () => {
    getAffectedFn.mockImplementationOnce(() => {
      const err = new Error("forbidden");
      err.name = "GqlApiError";
      (err as unknown as { statusCode: number }).statusCode = 200;
      throw err;
    });
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await impact.call(context, {}, "input.json", deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(stderr.join("")).toContain("forbidden");
    expect(getExitCode()).toBe(1);
  });
});
