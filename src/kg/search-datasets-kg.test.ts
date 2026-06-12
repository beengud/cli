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
import { DatasetDatasetKind, type DatasetResource } from "../rest/generated";

const repoRoot = resolve(import.meta.dir, "../..");
const kgSearchModulePath = resolve(repoRoot, "src/lib/kg-search.ts");
const getDatasetModulePath = resolve(
  repoRoot,
  "src/rest/dataset/get-dataset.ts",
);

let lookupReturn: RelatedEntities = {
  relatedDatasets: [],
  relatedMetrics: [],
  relatedDatasetIds: [],
  relatedMetricIds: [],
};

const lookupFn = mock((_args: { config: Config; key: string; value: string }) =>
  Promise.resolve(lookupReturn),
);

// Pretend the native API has every dataset the test edges name. Override
// per-test with `getDatasetByIdReturns`/`getDatasetThrowsFor` for richer
// scenarios (404s, partial population, etc.).
const datasetById = new Map<string, DatasetResource>();
const idsThatThrow = new Set<string>();

const getDatasetFn = mock(({ id }: { config: Config; id: string }) => {
  if (idsThatThrow.has(id)) {
    return Promise.reject(new Error("404"));
  }
  const ds = datasetById.get(id);
  if (!ds) {
    return Promise.reject(new Error(`unmocked id: ${id}`));
  }
  return Promise.resolve(ds);
});

let searchDatasetsViaKG: (typeof import("./search-datasets-kg"))["searchDatasetsViaKG"];

const testConfig = { customerId: "1", token: "t", domain: "d" } as Config;

function nativeDataset(id: string, label: string): DatasetResource {
  // Minimum non-null values for fields the dataset list command reads. Cast
  // covers the long tail of generated fields the renderer doesn't touch.
  return {
    id,
    label,
    kind: DatasetDatasetKind.Event,
    description: `desc ${id}`,
    fieldList: [],
    correlationTags: [],
    foreignKeys: [],
    createdBy: { id: "u-1", label: "Alice" },
    updatedBy: { id: "u-1", label: "Alice" },
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
  } as unknown as DatasetResource;
}

beforeAll(async () => {
  void mock.module(kgSearchModulePath, () => ({
    lookupTagValueRelatedEntities: lookupFn,
    normalizeTagKey: (k: string) => k,
    fetchDocumentsByIds: () => Promise.resolve([]),
  }));
  void mock.module(getDatasetModulePath, () => ({
    getDataset: getDatasetFn,
  }));

  const mod = await import("./search-datasets-kg.ts");
  searchDatasetsViaKG = mod.searchDatasetsViaKG;
});

afterAll(() => {
  mock.restore();
});

beforeEach(() => {
  lookupFn.mockClear();
  getDatasetFn.mockClear();
  datasetById.clear();
  idsThatThrow.clear();
  lookupReturn = {
    relatedDatasets: [],
    relatedMetrics: [],
    relatedDatasetIds: [],
    relatedMetricIds: [],
  };
});

function edges(datasets: { id: string; name: string }[]): RelatedEntities {
  return {
    relatedDatasets: datasets.map((d) => ({ ...d, description: null })),
    relatedMetrics: [],
    relatedDatasetIds: datasets.map((d) => d.id),
    relatedMetricIds: [],
  };
}

function seed(...rows: { id: string; label: string }[]) {
  for (const r of rows) datasetById.set(r.id, nativeDataset(r.id, r.label));
}

describe("searchDatasetsViaKG", () => {
  test("returns empty envelope when tag-value has no related datasets", async () => {
    const response = await searchDatasetsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
    });
    expect(response.datasets).toEqual([]);
    // KG path advertises "unknown / truncated" via meta.totalCount = -1.
    expect(response.meta.totalCount).toBe(-1);
    expect(getDatasetFn).not.toHaveBeenCalled();
  });

  test("returns DatasetResource rows enriched from the native API", async () => {
    lookupReturn = edges([{ id: "1", name: "alpha" }]);
    seed({ id: "1", label: "alpha" });

    const response = await searchDatasetsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
    });

    expect(response.datasets).toHaveLength(1);
    expect(response.meta.totalCount).toBe(-1);
    const row = response.datasets[0];
    expect(row?.id).toBe("1");
    expect(row?.label).toBe("alpha");
    expect(row?.kind).toBe(DatasetDatasetKind.Event);
    expect(row?.description).toBe("desc 1");
    expect(row?.fieldList).toEqual([]);
    expect(row?.correlationTags).toEqual([]);
    expect(row?.foreignKeys).toEqual([]);
  });

  test("dedupes edges by id before issuing native fetches", async () => {
    lookupReturn = edges([
      { id: "1", name: "alpha" },
      { id: "1", name: "alpha" },
      { id: "2", name: "beta" },
    ]);
    seed({ id: "1", label: "alpha" }, { id: "2", label: "beta" });

    const response = await searchDatasetsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
    });

    expect(response.datasets.map((r) => r.id)).toEqual(["1", "2"]);
    expect(getDatasetFn).toHaveBeenCalledTimes(2);
  });

  test("applies --label fuzzy filter on the source-of-truth label (plain substring)", async () => {
    lookupReturn = edges([
      { id: "1", name: "alpha-service" },
      { id: "2", name: "beta-service" },
      { id: "3", name: "checkout-service" },
    ]);
    seed(
      { id: "1", label: "alpha-service" },
      { id: "2", label: "beta-service" },
      { id: "3", label: "checkout-service" },
    );

    const response = await searchDatasetsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
      label: "checkout",
    });

    expect(response.datasets.map((r) => r.label)).toEqual(["checkout-service"]);
    // --label requires enrichment to compare against the source-of-truth
    // label, so all three candidates are fetched.
    expect(getDatasetFn).toHaveBeenCalledTimes(3);
  });

  test("--label uses the native label, NOT the KG edge name (handles KG cron lag)", async () => {
    // Regression: KG edge name and source-of-truth label have drifted
    // (e.g. dataset was renamed, KG hasn't re-indexed). Filtering must
    // use the native label so behavior matches `dataset list --label`.
    lookupReturn = edges([
      { id: "1", name: "old-stale-name" }, // KG name out of date
      { id: "2", name: "irrelevant" },
    ]);
    seed(
      { id: "1", label: "renamed-checkout-service" }, // current label
      { id: "2", label: "something-else" },
    );

    const response = await searchDatasetsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
      label: "checkout",
    });

    // Native label "renamed-checkout-service" matches; KG edge name
    // "old-stale-name" does not. Wrapper must follow the native label.
    expect(response.datasets.map((r) => r.id)).toEqual(["1"]);
  });

  test("--label uses token-fuzzy matching (mirrors celFuzzyContains)", async () => {
    lookupReturn = edges([
      { id: "1", name: "alpha-service" },
      { id: "2", name: "Tracing/Service Metrics" },
      { id: "3", name: "OpenTelemetry/Service" },
    ]);
    seed(
      { id: "1", label: "alpha-service" },
      { id: "2", label: "Tracing/Service Metrics" },
      { id: "3", label: "OpenTelemetry/Service" },
    );

    const response = await searchDatasetsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
      label: "service metrics",
    });

    expect(response.datasets.map((r) => r.label)).toEqual([
      "Tracing/Service Metrics",
    ]);
  });

  test("filter-then-slice: --limit cannot cut off a row that matches --label", async () => {
    lookupReturn = edges([
      { id: "1", name: "alpha-service" },
      { id: "2", name: "beta-service" },
      { id: "3", name: "gamma-service" },
      { id: "4", name: "checkout-service" },
    ]);
    seed(
      { id: "1", label: "alpha-service" },
      { id: "2", label: "beta-service" },
      { id: "3", label: "gamma-service" },
      { id: "4", label: "checkout-service" },
    );

    const response = await searchDatasetsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
      label: "checkout",
      limit: 2,
    });

    expect(response.datasets.map((r) => r.label)).toEqual(["checkout-service"]);
  });

  test("--offset + --limit paginate", async () => {
    lookupReturn = edges([
      { id: "1", name: "one" },
      { id: "2", name: "two" },
      { id: "3", name: "three" },
      { id: "4", name: "four" },
    ]);
    seed({ id: "2", label: "two" }, { id: "3", label: "three" });

    const response = await searchDatasetsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
      limit: 2,
      offset: 1,
    });

    expect(response.datasets.map((r) => r.label)).toEqual(["two", "three"]);
    // Sliced before enrichment: only the windowed ids hit the native API.
    expect(getDatasetFn).toHaveBeenCalledTimes(2);
  });

  test("--offset applies AFTER --label", async () => {
    lookupReturn = edges([
      { id: "1", name: "alpha-service" },
      { id: "2", name: "beta-service" },
      { id: "3", name: "service-gamma" },
      { id: "4", name: "service-delta" },
    ]);
    seed(
      { id: "1", label: "alpha-service" },
      { id: "2", label: "beta-service" },
      { id: "3", label: "service-gamma" },
      { id: "4", label: "service-delta" },
    );

    const response = await searchDatasetsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
      label: "service",
      offset: 2,
      limit: 10,
    });

    expect(response.datasets.map((r) => r.label)).toEqual([
      "service-gamma",
      "service-delta",
    ]);
  });

  test("drops ids the native API does not know about (KG/native lag)", async () => {
    lookupReturn = edges([
      { id: "1", name: "alpha" },
      { id: "stale", name: "deleted-dataset" },
      { id: "2", name: "beta" },
    ]);
    seed({ id: "1", label: "alpha" }, { id: "2", label: "beta" });
    idsThatThrow.add("stale");

    const response = await searchDatasetsViaKG({
      config: testConfig,
      correlationTagKey: "k",
      correlationTagValue: "v",
    });

    expect(response.datasets.map((r) => r.id)).toEqual(["1", "2"]);
  });

  test("forwards correlation tag key/value to lookupTagValueRelatedEntities", async () => {
    await searchDatasetsViaKG({
      config: testConfig,
      correlationTagKey: "service.name",
      correlationTagValue: "checkout",
    });
    expect(lookupFn).toHaveBeenCalledTimes(1);
    expect(lookupFn.mock.calls[0]?.[0]).toEqual({
      config: testConfig,
      key: "service.name",
      value: "checkout",
    });
  });
});
