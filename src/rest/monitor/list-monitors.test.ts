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
import type { Config } from "../../lib/config";
import { MonitorRuleKind, type MonitorListItem } from "../generated";
import { ResponseError } from "../generated/runtime";
import { MONITOR_LIST_PAGE_SIZE } from "./list-monitors";

const repoRoot = resolve(import.meta.dir, "../../..");
const clientModulePath = resolve(repoRoot, "src/rest/client.ts");

const CONFIG: Config = {
  customerId: "test-customer",
  domain: "observeinc.com",
  token: "test-token",
};

/** Request params recorded by the stubbed generated client, in call order. */
let calls: Record<string, unknown>[] = [];

/** Set per-test to drive the stubbed generated client's response. */
let respond: (params: Record<string, unknown>) => Promise<unknown>;

const listMonitorsApiFn = mock((params: Record<string, unknown>) => {
  calls.push(params);
  return respond(params);
});

function responseError(status: number): ResponseError {
  return new ResponseError(new Response("", { status }));
}

/** Await an expected rejection and hand back the thrown value. */
async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  throw new Error("expected listMonitors to reject, but it resolved");
}

let listMonitors: (typeof import("./list-monitors"))["listMonitors"];

beforeAll(async () => {
  void mock.module(clientModulePath, () => ({
    ObserveRestSDK: class {
      monitorApi = { listMonitors: listMonitorsApiFn };
    },
  }));

  const mod = await import("./list-monitors.ts");
  listMonitors = mod.listMonitors;
});

afterAll(() => {
  mock.restore();
});

beforeEach(() => {
  calls = [];
  listMonitorsApiFn.mockClear();
});

describe("listMonitors — versioned path", () => {
  test("unwraps `monitors` from the versioned envelope", async () => {
    const monitor = {
      id: "1",
      name: "Alpha Monitor",
    } as unknown as MonitorListItem;
    respond = () =>
      Promise.resolve({ monitors: [monitor], meta: { totalCount: 1 } });

    const result = await listMonitors({
      config: CONFIG,
      nameSubstring: "alpha",
    });

    expect(result).toEqual([monitor]);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      nameSubstring: "alpha",
      limit: MONITOR_LIST_PAGE_SIZE,
      offset: 0,
      observeApiVersion: "2026-08-04",
    });
  });

  test("returns an empty array when the envelope holds no monitors", async () => {
    respond = () => Promise.resolve({ monitors: [], meta: { totalCount: 0 } });

    expect(await listMonitors({ config: CONFIG })).toEqual([]);
    expect(calls).toHaveLength(1);
  });
});

describe("listMonitors — paging", () => {
  /** A server holding `total` monitors (ids "1".."total") that serves the
   *  requested window and caps a page at `cap`. */
  function pagedServer(total: number, cap = MONITOR_LIST_PAGE_SIZE) {
    const all = Array.from({ length: total }, (_, i) => ({
      id: String(i + 1),
      name: `Monitor ${i + 1}`,
    }));
    return (params: Record<string, unknown>) => {
      const offset = (params.offset as number | undefined) ?? 0;
      const limit = Math.min((params.limit as number | undefined) ?? cap, cap);
      return Promise.resolve({
        monitors: all.slice(offset, offset + limit),
        meta: { totalCount: total },
      });
    };
  }

  test("follows paging until every monitor is returned", async () => {
    respond = pagedServer(2345);

    const result = await listMonitors({ config: CONFIG });

    expect(result).toHaveLength(2345);
    expect(result[0]!.id).toBe("1");
    expect(result[2344]!.id).toBe("2345");
    expect(calls.map((c) => [c.limit, c.offset])).toEqual([
      [1000, 0],
      [1000, 1000],
      [1000, 2000],
    ]);
    // Every page carries the version header and the caller's params.
    for (const call of calls) {
      expect(call).toHaveProperty("observeApiVersion", "2026-08-04");
    }
  });

  test("stops at meta.totalCount without an extra empty-page request", async () => {
    respond = pagedServer(2000);

    const result = await listMonitors({ config: CONFIG });

    expect(result).toHaveLength(2000);
    expect(calls).toHaveLength(2);
  });

  test("a limit larger than one page is fetched page by page", async () => {
    respond = pagedServer(2345);

    const result = await listMonitors({ config: CONFIG, limit: 1500 });

    expect(result).toHaveLength(1500);
    expect(result[1499]!.id).toBe("1500");
    expect(calls.map((c) => [c.limit, c.offset])).toEqual([
      [1000, 0],
      [500, 1000],
    ]);
  });

  test("limit and offset select a window inside the list", async () => {
    respond = pagedServer(135);

    const result = await listMonitors({
      config: CONFIG,
      limit: 5,
      offset: 130,
    });

    expect(result.map((m) => m.id)).toEqual([
      "131",
      "132",
      "133",
      "134",
      "135",
    ]);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ limit: 5, offset: 130 });
  });

  test("offset alone returns everything from the offset onwards", async () => {
    respond = pagedServer(135);

    const result = await listMonitors({ config: CONFIG, offset: 100 });

    expect(result).toHaveLength(35);
    expect(result[0]!.id).toBe("101");
    expect(calls).toHaveLength(1);
  });

  test("keeps paging past a server page smaller than asked for", async () => {
    // The server caps a page at 100 (a default page size that is smaller
    // than ours): the total count says there is more, so keep going.
    respond = pagedServer(250, 100);

    const result = await listMonitors({ config: CONFIG });

    expect(result).toHaveLength(250);
    expect(calls.map((c) => c.offset)).toEqual([0, 100, 200]);
  });

  test("an unknown totalCount (-1) pages until an empty page", async () => {
    const server = pagedServer(150, 100);
    respond = async (params) => {
      const page = (await server(params)) as { monitors: unknown[] };
      return { monitors: page.monitors, meta: { totalCount: -1 } };
    };

    const result = await listMonitors({ config: CONFIG });

    expect(result).toHaveLength(150);
    expect(calls.map((c) => c.offset)).toEqual([0, 100, 150]);
  });

  test("the filter is sent with every page", async () => {
    respond = pagedServer(1200);

    await listMonitors({ config: CONFIG, nameSubstring: "mop" });

    expect(calls).toHaveLength(2);
    for (const call of calls) {
      expect(call).toMatchObject({ nameSubstring: "mop" });
    }
  });

  test("a 403 after the first page is not a legacy fallback", async () => {
    const server = pagedServer(1200);
    respond = (params) =>
      (params.offset as number) > 0
        ? Promise.reject(responseError(403))
        : server(params);

    const err = await captureError(listMonitors({ config: CONFIG }));

    expect(err).toBeInstanceOf(ResponseError);
    expect((err as ResponseError).response.status).toBe(403);
    expect(calls).toHaveLength(2);
  });
});

describe("listMonitors — legacy fallback on 403", () => {
  /** Reject the versioned request with 403; serve a bare legacy array on retry. */
  function legacyOnRetry(legacy: unknown) {
    return (params: Record<string, unknown>) =>
      params.observeApiVersion == null
        ? Promise.resolve(legacy)
        : Promise.reject(responseError(403));
  }

  test("retries without the version header and preserves `name`", async () => {
    respond = legacyOnRetry([
      {
        id: "1",
        name: "Legacy Monitor",
        description: null,
        disabled: false,
        ruleKind: "Count",
      },
    ]);

    const result = await listMonitors({
      config: CONFIG,
      limit: 5,
      nameSubstring: "legacy",
    });

    expect(calls).toHaveLength(2);
    // The retry must drop observeApiVersion but keep the caller's filter.
    // The legacy shape ignores limit/offset, so they are not sent either.
    expect(calls[0]).toHaveProperty("observeApiVersion", "2026-08-04");
    expect(calls[1]).not.toHaveProperty("observeApiVersion");
    expect(calls[1]).toMatchObject({ nameSubstring: "legacy" });
    expect(calls[1]).not.toHaveProperty("limit");
    expect(calls[1]).not.toHaveProperty("offset");

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("1");
    expect(result[0]!.name).toBe("Legacy Monitor");
    expect(result[0]!.ruleKind).toBe(MonitorRuleKind.Count);
  });

  test("maps a legacy monitor with no name to an empty name", async () => {
    respond = legacyOnRetry([{ id: "7" }]);

    const result = await listMonitors({ config: CONFIG });

    expect(result[0]!.name).toBe("");
  });

  test("applies limit/offset locally to the legacy array", async () => {
    respond = legacyOnRetry(
      ["1", "2", "3", "4", "5"].map((id) => ({ id, name: `m${id}` })),
    );

    const result = await listMonitors({ config: CONFIG, limit: 2, offset: 1 });

    expect(calls).toHaveLength(2);
    expect(result.map((m) => m.id)).toEqual(["2", "3"]);
  });

  test("returns every legacy monitor from the offset when no limit is set", async () => {
    respond = legacyOnRetry(
      ["1", "2", "3", "4", "5"].map((id) => ({ id, name: `m${id}` })),
    );

    const result = await listMonitors({ config: CONFIG, offset: 3 });

    expect(result.map((m) => m.id)).toEqual(["4", "5"]);
  });

  test("returns an empty array when the legacy retry yields none", async () => {
    respond = legacyOnRetry([]);

    expect(await listMonitors({ config: CONFIG })).toEqual([]);
    expect(calls).toHaveLength(2);
  });
});

describe("listMonitors — error propagation", () => {
  test("rethrows a non-403 ResponseError without retrying", async () => {
    respond = () => Promise.reject(responseError(500));

    const err = await captureError(listMonitors({ config: CONFIG }));

    expect(err).toBeInstanceOf(ResponseError);
    expect((err as ResponseError).response.status).toBe(500);
    expect(calls).toHaveLength(1);
  });

  test("rethrows a 401 ResponseError without retrying", async () => {
    respond = () => Promise.reject(responseError(401));

    const err = await captureError(listMonitors({ config: CONFIG }));

    expect(err).toBeInstanceOf(ResponseError);
    expect((err as ResponseError).response.status).toBe(401);
    expect(calls).toHaveLength(1);
  });

  test("rethrows a non-API error without retrying", async () => {
    respond = () => Promise.reject(new TypeError("network down"));

    const err = await captureError(listMonitors({ config: CONFIG }));

    expect(err).toBeInstanceOf(TypeError);
    expect((err as TypeError).message).toBe("network down");
    expect(calls).toHaveLength(1);
  });
});
