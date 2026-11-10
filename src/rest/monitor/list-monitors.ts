import type { Config } from "../../lib/config";
import { ObserveRestSDK } from "../client";
import { ResponseError } from "../generated/runtime";
import type {
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
export async function listMonitors({
  config,
  limit,
  offset,
  ...params
}: ListMonitorsParams): Promise<MonitorListItem[]> {
  const sdk = new ObserveRestSDK(config);
  const start = offset ?? 0;
  const collected: MonitorListItem[] = [];
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
      return listMonitorsLegacy(sdk, params).then((all) =>
        all.slice(start, limit == null ? undefined : start + limit),
      );
    }

    const page = response.monitors;
    collected.push(...page);
    next += page.length;
    if (page.length === 0) break;

    // The envelope is typed as always carrying `meta.totalCount`; check the
    // runtime value anyway so a server that omits it cannot loop forever.
    const total: unknown = response.meta.totalCount;
    if (typeof total !== "number") {
      // No usable meta (not the documented envelope): a short page is the end.
      if (page.length < pageLimit) break;
    } else if (total >= 0 && next >= total) {
      break;
    }
    // total === -1 (unknown): keep paging until an empty page.
  }

  return collected;
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
