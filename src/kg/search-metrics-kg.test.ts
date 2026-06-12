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
import type { Config } from "../lib/config";
import type { RelatedEntities } from "../lib/kg-search";

const repoRoot = resolve(import.meta.dir, "../..");
const kgSearchModulePath = resolve(repoRoot, "src/lib/kg-search.ts");

let lookupReturn: RelatedEntities = {
  relatedDatasets: [],
  relatedMetrics: [],
  relatedDatasetIds: [],
  relatedMetricIds: [],
};

const lookupFn = mock((_args: { config: Config; key: string; value: string }) =>
  Promise.resolve(lookupReturn),
);

// fetchDocumentsByIds returns empty so the wrapper falls back to edge
// projections for every metric (exercising the path we actually hit on
// tenants where metric KG docs are keyed differently).
const fetchDocumentsByIdsFn = mock(
  (): Promise<unknown[]> => Promise.resolve([]),
);

let searchMetricsViaKG: (typeof import("./search-metrics-kg"))["searchMetricsViaKG"];

const testConfig = { customerId: "1", token: "t", domain: "d" } as Config;

beforeAll(async () => {
  void mock.module(kgSearchModulePath, () => ({
    lookupTagValueRelatedEntities: lookupFn,
    fetchDocumentsByIds: fetchDocumentsByIdsFn,
    normalizeTagKey: (k: string) => k,
  }));

  const mod = await import("./search-metrics-kg.ts");
  searchMetricsViaKG = mod.searchMetricsViaKG;
});

afterAll(() => {
  mock.restore();
});

beforeEach(() => {
  lookupFn.mockClear();
  fetchDocumentsByIdsFn.mockClear();
  lookupReturn = {
    relatedDatasets: [],
    relatedMetrics: [],
    relatedDatasetIds: [],
    relatedMetricIds: [],
  };
});

function edges(
  metrics: { name: string; datasetId: string }[],
): RelatedEntities {
  return {
    relatedDatasets: [],
    relatedMetrics: metrics,
    relatedDatasetIds: [],
    relatedMetricIds: metrics.map((m) => `${m.name}|${m.datasetId}`),
  };
}

describe("searchMetricsViaKG", () => {
  test("returns empty envelope when tag-value has no related metrics", async () => {
    const response = await searchMetricsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
    });
    expect(response).toEqual({ matches: [], numSearched: "-1", datasets: [] });
  });

  test("projects KG edges into GQL match shape with empty strings for absent leaves", async () => {
    lookupReturn = edges([{ name: "cpu.util", datasetId: "ds-1" }]);
    const response = await searchMetricsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
    });
    expect(response.matches).toHaveLength(1);
    expect(response.matches[0]).toMatchObject({
      datasetId: "ds-1",
      metric: {
        name: "cpu.util",
        description: "",
        type: "",
        unit: "",
        aggregate: "",
        rollup: "",
      },
    });
    // KG path always reports unknown total — observe-side decision.
    expect(response.numSearched).toBe("-1");
  });

  test("dedupes by name|datasetId", async () => {
    lookupReturn = edges([
      { name: "cpu.util", datasetId: "ds-1" },
      { name: "cpu.util", datasetId: "ds-1" },
      { name: "mem.rss", datasetId: "ds-1" },
    ]);
    const response = await searchMetricsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
    });
    expect(response.matches.map((r) => r.metric.name)).toEqual([
      "cpu.util",
      "mem.rss",
    ]);
  });

  test("applies --match fuzzy filter", async () => {
    lookupReturn = edges([
      { name: "cpu.utilization", datasetId: "ds-1" },
      { name: "memory.rss", datasetId: "ds-1" },
      { name: "cpu.system", datasetId: "ds-2" },
    ]);
    const response = await searchMetricsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
      match: "cpu",
    });
    expect(response.matches.map((r) => r.metric.name)).toEqual([
      "cpu.utilization",
      "cpu.system",
    ]);
  });

  test("filter-then-slice: --limit cannot cut off a row that matches --match", async () => {
    lookupReturn = edges([
      { name: "memory.rss", datasetId: "ds-1" },
      { name: "disk.io", datasetId: "ds-1" },
      { name: "network.rx", datasetId: "ds-1" },
      { name: "cpu.utilization", datasetId: "ds-2" },
    ]);
    const response = await searchMetricsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
      match: "cpu",
      limit: 2,
    });
    expect(response.matches.map((r) => r.metric.name)).toEqual([
      "cpu.utilization",
    ]);
  });

  test("--offset + --limit paginate", async () => {
    lookupReturn = edges([
      { name: "m1", datasetId: "ds-1" },
      { name: "m2", datasetId: "ds-1" },
      { name: "m3", datasetId: "ds-1" },
      { name: "m4", datasetId: "ds-1" },
    ]);
    const response = await searchMetricsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
      limit: 2,
      offset: 1,
    });
    expect(response.matches.map((r) => r.metric.name)).toEqual(["m2", "m3"]);
  });

  test("forwards correlation tag key/value to lookupTagValueRelatedEntities", async () => {
    await searchMetricsViaKG({
      config: testConfig,
      correlationTagKey: "service.name",
      correlationTagValue: "checkout",
    });
    const args = lookupFn.mock.calls[0]?.[0];
    expect(args).toEqual({
      config: testConfig,
      key: "service.name",
      value: "checkout",
    });
  });
});

// Also exercise the happy path where fetchDocumentsByIds returns a real
// metric document: the wrapper should prefer it over the edge fallback and
// populate the richer leaves.
describe("searchMetricsViaKG with KG metric documents", () => {
  const fetchReturning = (docs: unknown[]) => {
    fetchDocumentsByIdsFn.mockImplementationOnce(() => Promise.resolve(docs));
  };

  test("prefers metric document projection over edge fallback", async () => {
    lookupReturn = edges([{ name: "cpu.util", datasetId: "ds-1" }]);
    fetchReturning([
      {
        id: "cpu.util|ds-1",
        metadata: {
          originalContent: {
            metric: {
              name: "cpu.util",
              datasetId: "ds-1",
              description: "CPU utilization",
              type: "gauge",
              unit: "percent",
              aggregate: "AVG",
              rollup: "AVG",
            },
          },
        },
      },
    ]);

    const response = await searchMetricsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
    });

    expect(response.matches).toHaveLength(1);
    expect(response.matches[0]).toMatchObject({
      datasetId: "ds-1",
      metric: {
        name: "cpu.util",
        description: "CPU utilization",
        type: "gauge",
        unit: "percent",
        aggregate: "AVG",
        rollup: "AVG",
      },
    });
  });
});
