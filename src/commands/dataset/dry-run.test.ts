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

const saveDatasetDryRunFn = mock((_config: unknown, _variables: unknown) =>
  Promise.resolve({
    dataset: { id: "99001", name: "MyDataset" },
    dematerializedDatasets: [{ dataset: { id: "88001", name: "DownstreamA" } }],
    errorDatasets: [],
  }),
);

let dryRun: (typeof import("./dry-run"))["dryRun"];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

const deps = {
  loadConfig: loadConfigFn,
  readDatasetInput: readDatasetInputFn,
  saveDatasetDryRun: saveDatasetDryRunFn,
} as Parameters<(typeof import("./dry-run"))["dryRun"]>[3];

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  void mock.module(gqlModulePath, () => ({
    saveDatasetDryRun: saveDatasetDryRunFn,
  }));

  const mod = await import("./dry-run.ts");
  dryRun = mod.dryRun;
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

describe("dataset dry-run", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    readDatasetInputFn.mockClear();
    saveDatasetDryRunFn.mockClear();
    saveDatasetDryRunFn.mockImplementation(() =>
      Promise.resolve({
        dataset: { id: "99001", name: "MyDataset" },
        dematerializedDatasets: [
          { dataset: { id: "88001", name: "DownstreamA" } },
        ],
        errorDatasets: [],
      }),
    );
  });

  test("prints dataset and rematerialization lines on success", async () => {
    const { context, stdout, stderr } = createMockContext();
    await dryRun.call(context, {}, "input.json", deps);

    const out = stdout.join("");
    expect(out).toContain("Dataset: MyDataset (99001)");
    expect(out).toContain("Would rematerialize: DownstreamA (88001)");
    expect(stderr.join("")).toBe("");
  });

  test("passes mapped variables to saveDatasetDryRun", async () => {
    const { context } = createMockContext();
    await dryRun.call(context, {}, "input.json", deps);

    const [, variables] = saveDatasetDryRunFn.mock.calls[0]!;
    expect(variables).toEqual({
      workspaceId: "42379913",
      dataset: { label: "MyDataset" },
      query: {
        outputStage: "main",
        stages: [{ id: "main", pipeline: "filter true", input: [] }],
      },
    });
  });

  test("does not print rematerialization line when none returned", async () => {
    saveDatasetDryRunFn.mockImplementationOnce(() =>
      Promise.resolve({
        dataset: { id: "99002", name: "CleanDataset" },
        dematerializedDatasets: [],
        errorDatasets: [],
      }),
    );
    const { context, stdout } = createMockContext();
    await dryRun.call(context, {}, "input.json", deps);

    const out = stdout.join("");
    expect(out).toContain("Dataset: CleanDataset (99002)");
    expect(out).not.toContain("Would rematerialize");
  });

  test("prints error datasets and exits 1 when errors present", async () => {
    saveDatasetDryRunFn.mockImplementationOnce(() =>
      Promise.resolve({
        dataset: null,
        dematerializedDatasets: [],
        errorDatasets: [
          {
            datasetId: "77001",
            datasetName: "BadDataset",
            text: "syntax error",
          },
          { datasetId: "77002", datasetName: "Err2", text: "second error" },
        ],
      }),
    );
    const { context, stdout, getExitCode } = createMockContext();
    try {
      await dryRun.call(context, {}, "input.json", deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }

    const out = stdout.join("");
    expect(out).toContain("Error in BadDataset: syntax error");
    expect(out).toContain("Error in Err2: second error");
    expect(getExitCode()).toBe(1);
  });

  test("exits 1 when input cannot be read", async () => {
    readDatasetInputFn.mockImplementationOnce(() => {
      throw new Error('could not read file "missing.json"');
    });
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await dryRun.call(context, {}, "missing.json", deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(stderr.join("")).toContain("could not read file");
    expect(getExitCode()).toBe(1);
  });
});
