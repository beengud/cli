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
import type { Config } from "../../lib/config";
import type { GqlMetricMatch } from "../../gql/metric/list-metrics";
import { createWriter } from "../../lib/writer";

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

function metricStub(name: string, datasetId: string): GqlMetricMatch {
  return {
    datasetId,
    metric: {
      name,
      nameWithPath: "",
      description: "",
      type: "" as GqlMetricMatch["metric"]["type"],
      unit: "",
      aggregate: "",
      rollup: "",
      state: "" as GqlMetricMatch["metric"]["state"],
      interval: null,
      userDefined: false,
    },
  };
}

function envelope(matches: GqlMetricMatch[], numSearched = "-1") {
  return { matches, numSearched, datasets: [] };
}

const listMetricsFn = mock((_config: Config, _vars: unknown) =>
  Promise.resolve(envelope([metricStub("native.metric", "ds-1")], "1")),
);

let lastSearchKGArgs:
  | {
      config: Config;
      correlationTagKey: string;
      correlationTagValue: string;
      match?: string;
      limit?: number;
      offset?: number;
    }
  | undefined;

let searchKGReturn = envelope([metricStub("kg.metric", "ds-42")]);

const searchMetricsViaKGFn = mock(
  (args: {
    config: Config;
    correlationTagKey: string;
    correlationTagValue: string;
    match?: string;
    limit?: number;
    offset?: number;
  }) => {
    lastSearchKGArgs = args;
    return Promise.resolve(searchKGReturn);
  },
);

let list: (typeof import("./list"))["list"];
let validateMetricFlags: (typeof import("./list"))["validateMetricFlags"];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

// Inject backends via `deps` instead of `mock.module` so the wrapper-level
// tests in `src/rest/metric/search-metrics-kg.test.ts` aren't affected by
// bun's process-global module mocks.
const deps = {
  loadConfig: loadConfigFn,
  searchMetricsViaKG: searchMetricsViaKGFn,
  listMetrics: listMetricsFn,
} as Parameters<(typeof import("./list"))["list"]>[1];

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  const mod = await import("./list.ts");
  list = mod.list;
  validateMetricFlags = mod.validateMetricFlags;
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

  return {
    context,
    stdout,
    stderr,
    getExitCode: () => exitCode,
  };
}

describe("validateMetricFlags", () => {
  test("no-op when correlation-tag flags are absent", () => {
    expect(() => validateMetricFlags({ limit: 10, match: "" })).not.toThrow();
  });

  test("rejects --correlation-tag-value without --correlation-tag-key", () => {
    expect(() =>
      validateMetricFlags({
        limit: 10,
        match: "",
        correlationTagValue: "checkout",
      }),
    ).toThrow(/--correlation-tag-value requires --correlation-tag-key/);
  });

  test("rejects --correlation-tag-key without --correlation-tag-value", () => {
    expect(() =>
      validateMetricFlags({
        limit: 10,
        match: "",
        correlationTagKey: "service.name",
      }),
    ).toThrow(/--correlation-tag-key requires --correlation-tag-value/);
  });

  test("allows both correlation-tag flags together", () => {
    expect(() =>
      validateMetricFlags({
        limit: 10,
        match: "",
        correlationTagKey: "k",
        correlationTagValue: "v",
      }),
    ).not.toThrow();
  });
});

describe("metric list routing", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    listMetricsFn.mockClear();
    searchMetricsViaKGFn.mockClear();
    lastSearchKGArgs = undefined;
    searchKGReturn = envelope([metricStub("kg.metric", "ds-42")]);
  });

  test("routes to listMetrics when correlation-tag flags are absent", async () => {
    const { context } = createMockContext();
    await list.call(context, { limit: 10, match: "", json: true }, deps);
    expect(listMetricsFn).toHaveBeenCalledTimes(1);
    expect(searchMetricsViaKGFn).not.toHaveBeenCalled();
  });

  test("routes to searchMetricsViaKG when both correlation-tag flags are set", async () => {
    const { context } = createMockContext();
    await list.call(
      context,
      {
        limit: 10,
        match: "",
        json: true,
        correlationTagKey: "service.name",
        correlationTagValue: "checkout",
      },
      deps,
    );
    expect(searchMetricsViaKGFn).toHaveBeenCalledTimes(1);
    expect(listMetricsFn).not.toHaveBeenCalled();
    expect(lastSearchKGArgs).toMatchObject({
      correlationTagKey: "service.name",
      correlationTagValue: "checkout",
    });
  });

  test("rejects --correlation-tag-value without --correlation-tag-key at runtime", async () => {
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await list.call(
        context,
        {
          limit: 10,
          match: "",
          json: true,
          correlationTagValue: "checkout",
        },
        deps,
      );
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("--correlation-tag-value");
    expect(listMetricsFn).not.toHaveBeenCalled();
    expect(searchMetricsViaKGFn).not.toHaveBeenCalled();
  });

  test("forwards --match / --limit / --offset to searchMetricsViaKG", async () => {
    const { context } = createMockContext();
    await list.call(
      context,
      {
        limit: 25,
        match: "cpu",
        offset: 5,
        json: true,
        correlationTagKey: "service.name",
        correlationTagValue: "checkout",
      },
      deps,
    );
    expect(lastSearchKGArgs).toMatchObject({
      correlationTagKey: "service.name",
      correlationTagValue: "checkout",
      match: "cpu",
      limit: 25,
      offset: 5,
    });
  });

  test("omits --match when flag is empty so wrapper does not filter", async () => {
    const { context } = createMockContext();
    await list.call(
      context,
      {
        limit: 10,
        match: "",
        json: true,
        correlationTagKey: "k",
        correlationTagValue: "v",
      },
      deps,
    );
    expect(lastSearchKGArgs).toMatchObject({
      correlationTagKey: "k",
      correlationTagValue: "v",
      limit: 10,
    });
    expect(lastSearchKGArgs?.match).toBeUndefined();
    expect(lastSearchKGArgs?.offset).toBeUndefined();
  });
});

describe("metric list rendering", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    listMetricsFn.mockClear();
    searchMetricsViaKGFn.mockClear();
  });

  test("--json emits the GQL metric match shape directly", async () => {
    const { context, stdout } = createMockContext();
    await list.call(context, { limit: 10, match: "", json: true }, deps);
    const payload: unknown = JSON.parse(stdout.join(""));
    expect(payload).toEqual([
      {
        datasetId: "ds-1",
        metric: {
          name: "native.metric",
          nameWithPath: "",
          description: "",
          type: "",
          unit: "",
          aggregate: "",
          rollup: "",
          state: "",
          interval: null,
          userDefined: false,
        },
      },
    ]);
  });
});
