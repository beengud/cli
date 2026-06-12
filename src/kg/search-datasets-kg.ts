/**
 * KG-backed dataset search used by
 * `dataset list --correlation-tag-key/--correlation-tag-value`.
 *
 * Native `GET /v1/datasets` has no correlation-tag filter, so the flow is
 * two-step:
 *
 *   1. Resolve the tag-value document in the V2 Knowledge Graph and read
 *      its related dataset edges (id + name from the KG).
 *   2. Enrich each id with `getDataset({id})` and return the resulting
 *      `DatasetResource` rows so this wrapper returns the same envelope
 *      shape as `listDatasets`.
 *
 * Result: the helper is interchangeable with `listDatasets` from the
 * caller's perspective. The command file does not need any KG-aware
 * accessors and `--format json` output is identical between backends.
 *
 * `--label` filtering uses the source-of-truth `label` from the native
 * response (not the KG edge name) so the filter behaves identically to
 * native `dataset list --label`, even if the KG cron is lagging behind a
 * dataset rename. The cost is enriching every edge on `--label` queries
 * (typically <50 native GETs in parallel for a tag-value); the no-label
 * fast path still slices to `--limit` rows before enrichment.
 *
 * Filter ordering: `--label` (post-enrichment) → `--offset` → `--limit`,
 * so `--limit N` cannot cut off a row that would have matched `--label`
 * past the cut.
 *
 * `meta.totalCount` is `-1` to signal "unknown / truncated": the KG path
 * caps related-entity edges (`MAX_DATASETS = 5` on the AI SRE side) and
 * the count of returned rows is not a population total. Callers that
 * surface a "(N total)" footer should suppress it when `totalCount < 0`
 * — see `src/commands/dataset/list.ts` for the canonical usage.
 */

import { fuzzyContains } from "../lib/cel";
import type { Config } from "../lib/config";
import {
  lookupTagValueRelatedEntities,
  type RelatedDataset,
} from "../lib/kg-search";
import type { DatasetResource } from "../rest/generated";
import { getDataset } from "../rest/dataset/get-dataset";
import type { listDatasets } from "../rest/dataset/list-datasets";

export async function searchDatasetsViaKG({
  config,
  correlationTagKey,
  correlationTagValue,
  label,
  limit,
  offset,
}: {
  config: Config;
  correlationTagKey: string;
  correlationTagValue: string;
  label?: string;
  limit?: number;
  offset?: number;
}): ReturnType<typeof listDatasets> {
  const related = await lookupTagValueRelatedEntities({
    config,
    key: correlationTagKey,
    value: correlationTagValue,
  });

  // Dedupe by id; drop edges with no id (cannot enrich them).
  const dedup = new Map<string, RelatedDataset>();
  for (const d of related.relatedDatasets) {
    if (!d.id || dedup.has(d.id)) continue;
    dedup.set(d.id, d);
  }
  const candidates = Array.from(dedup.values());
  const start = offset ?? 0;

  // No-label fast path: slice the candidate window first so we issue at
  // most `limit` native GETs instead of one per edge.
  if (label == null || label === "") {
    const window =
      limit != null
        ? candidates.slice(start, start + limit)
        : candidates.slice(start);
    const enriched = await enrich({ config, candidates: window });
    return { datasets: enriched, meta: { totalCount: -1 } };
  }

  // Label path: filter on the source-of-truth `label` from the native
  // response (not the KG edge name) so behavior matches `dataset list
  // --label` exactly, even if the KG cron is lagging behind a rename.
  // Cost is enriching every edge — bounded by tag-value edge list size,
  // typically <50.
  const enriched = await enrich({ config, candidates });
  const filtered = enriched.filter((d) => fuzzyContains(d.label, label));
  const sliced =
    limit != null
      ? filtered.slice(start, start + limit)
      : filtered.slice(start);
  return { datasets: sliced, meta: { totalCount: -1 } };
}

/**
 * Resolve KG dataset edges to `DatasetResource` rows by issuing one
 * `getDataset` per id in parallel. `Promise.allSettled` so a single 404
 * (KG can lag behind a deletion, or this token may not have read access
 * to a row) doesn't blow up the whole list — matches the
 * `lookupTagValueRelatedEntities` ethos of "degrade gracefully, return
 * what we can".
 */
async function enrich({
  config,
  candidates,
}: {
  config: Config;
  candidates: RelatedDataset[];
}): Promise<DatasetResource[]> {
  const settled = await Promise.allSettled(
    candidates.map((c) => getDataset({ config, id: c.id })),
  );
  const datasets: DatasetResource[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") {
      datasets.push(result.value);
    }
  }
  return datasets;
}
