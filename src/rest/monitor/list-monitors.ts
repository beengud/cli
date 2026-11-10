import type { Config } from "../../lib/config";
import { ObserveRestSDK } from "../client";
import { ResponseError } from "../generated/runtime";
import type {
  Meta,
  MonitorApiListMonitorsRequest,
  MonitorListItem,
  MonitorListResponse,
} from "../generated";

/**
 * Largest page the versioned endpoint accepts. `limit=1000` is honoured by the
 * server; `limit=5000` is rejected with 400 (checked live, 2026-11-10). A
 * window larger than this is fetched page by page.
 */
export const MONITOR_LIST_PAGE_SIZE = 1000;

export type ListMonitorsParams = {
  config: Config;
} & Omit<MonitorApiListMonitorsRequest, "observeApiVersion">;

export interface MonitorListPage {
  /** The requested window of the list, in server order. */
  monitors: MonitorListItem[];
  /**
   * How many monitors match the filter, independent of the window, when the
   * server says (`meta.totalCount`); `undefined` when it reports -1 (unknown)
   * or omits it. The legacy shape returns the whole list, so it is its length.
   */
  totalCount: number | undefined;
}

/**
 * Lists monitors through the versioned REST endpoint, following `limit`/
 * `offset` paging until the requested window is complete.
 *
 * `offset` is the first monitor to return and `limit` the most to return;
 * with no `limit` every monitor from `offset` onwards is returned. The
 * server is asked for pages of at most `MONITOR_LIST_PAGE_SIZE`, so a
 * window of any size, or a server that starts paging by default, never
 * truncates the result. Paging stops when the window is full, the server
 * returns an empty page, or `meta.totalCount` (when known) is reached.
 *
 * The legacy bare-array response (the account is not yet on the versioned
 * shape, so the header gets a 403) ignores `limit`/`offset`, so the window
 * is applied locally instead.
 */
export async function listMonitorsPage({
  config,
  limit,
  offset,
  ...params
}: ListMonitorsParams): Promise<MonitorListPage> {
  const sdk = new ObserveRestSDK(config);
  const start = offset ?? 0;
  const collected: MonitorListItem[] = [];
  let totalCount: number | undefined;
  let next = start;

  for (;;) {
    const remaining =
      limit == null ? MONITOR_LIST_PAGE_SIZE : limit - collected.length;
    if (remaining <= 0) break;
    const pageLimit = Math.min(MONITOR_LIST_PAGE_SIZE, remaining);

    let response: MonitorListResponse;
    try {
      // Use the versioned envelope when the feature is enabled for this account.
      response = await sdk.monitorApi.listMonitors({
        ...params,
        limit: pageLimit,
        offset: next,
        observeApiVersion: "2026-08-04",
      });
    } catch (err) {
      if (
        collected.length > 0 ||
        !(err instanceof ResponseError && err.response.status === 403)
      ) {
        throw err;
      }
      // Feature not yet enabled for this account or cluster. Fall back to the
      // legacy bare-array response (no Observe-Api-Version header), which
      // returns every monitor and ignores limit/offset.
      const all = await listMonitorsLegacy(sdk, params);
      return {
        monitors: all.slice(start, limit == null ? undefined : start + limit),
        totalCount: all.length,
      };
    }

    const page = response.monitors;
    collected.push(...page);
    next += page.length;
    if (page.length === 0) break;

    // The envelope is typed as always carrying `meta.totalCount`; the client
    // hands the JSON through unconverted, so read it defensively: a server
    // that omits it, or reports -1 (unknown), is paged until an empty page.
    const total: unknown = (response as { meta?: Partial<Meta> }).meta
      ?.totalCount;
    if (typeof total === "number" && total >= 0) {
      totalCount = total;
      if (next >= total) break;
    }
  }

  return { monitors: collected, totalCount };
}

/** `listMonitorsPage` without the count: the monitors in the window. */
export async function listMonitors(
  params: ListMonitorsParams,
): Promise<MonitorListItem[]> {
  return (await listMonitorsPage(params)).monitors;
}

async function listMonitorsLegacy(
  sdk: ObserveRestSDK,
  params: Omit<MonitorApiListMonitorsRequest, "observeApiVersion">,
): Promise<MonitorListItem[]> {
  const legacy = (await sdk.monitorApi.listMonitors(params)) as unknown as {
    id?: string;
    name?: string;
    description?: string | null;
    disabled?: boolean;
    ruleKind?: string;
    [key: string]: unknown;
  }[];
  return legacy.map(
    (m) =>
      ({
        ...m,
        name: m.name ?? "",
      }) as unknown as MonitorListItem,
  );
}
