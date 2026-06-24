import type { Config } from "../../lib/config";
import {
  datasetQueryOutput as datasetQueryOutputDefault,
  type GqlDatasetQueryField,
  type PaginatedResults,
} from "../../gql/dataset/dataset-query-output";
import {
  type StageInput,
  ResultKind,
  VariantEncodingMode,
  RollupMode,
} from "../../gql/generated/graphql";
import { transposeColumnsToRows } from "../../lib/transpose";

/**
 * The dataset that the observe-agent fleet writes lifecycle events to. Fleet
 * does not use meta CRUD: it runs an OPAL query against this dataset by path
 * (format `projectlabel.datasetlabel`), mirroring the Go CLI's
 * `Default.Observe Agent/Events` target.
 */
export const FLEET_DATASET_PATH = "Default.Observe Agent/Events";

const DEFAULT_LIMIT = 1000;

/** A single result row keyed by the OPAL output column name. */
export type FleetRow = Record<string, unknown>;

/** Parsed fleet query result: ordered field metadata plus row records. */
export interface FleetQueryResult {
  fields: GqlDatasetQueryField[];
  headers: string[];
  rows: FleetRow[];
}

export interface RunFleetQueryDeps {
  datasetQueryOutput?: typeof datasetQueryOutputDefault;
}

/**
 * Execute a fleet OPAL pipeline against the Observe Agent Events dataset and
 * return the rows in OPAL output order. Reuses the new CLI's existing OPAL
 * execution path (`datasetQueryOutput` → `StageInput`) rather than the Go
 * CLI's `/v1/meta/export/query` REST endpoint; column order and sorting are
 * carried by the OPAL `pick_col`/`sort` operators in `pipeline`.
 */
export async function runFleetQuery(
  {
    config,
    pipeline,
    window,
  }: {
    config: Config;
    pipeline: string;
    window: string;
  },
  deps: RunFleetQueryDeps = {},
): Promise<FleetQueryResult> {
  const { datasetQueryOutput = datasetQueryOutputDefault } = deps;

  const stage: StageInput = {
    stageId: "query",
    pipeline,
    inputs: [
      {
        inputName: "_",
        datasetPath: FLEET_DATASET_PATH,
      },
    ],
    pagination: {
      initialRows: `${DEFAULT_LIMIT}`,
    },
    presentation: {
      resultKinds: [ResultKind.ResultKindSchema, ResultKind.ResultKindData],
      rollup: {},
      rollupMode: RollupMode.Never,
      variantEncodingMode: VariantEncodingMode.String,
    },
    bestEffortBinding: true,
  };

  const taskResults = await datasetQueryOutput({
    config,
    variables: {
      query: [stage],
      params: getFleetTimeRange(window),
    },
  });

  const taskResultErrors = taskResults.filter((r) => !!r.errors?.length);
  if (taskResultErrors.length > 0) {
    const message = taskResultErrors
      .map((e) => e.errors?.map((err) => err.message).join(", "))
      .join(", ");
    throw new Error(message);
  }

  const stageTaskResults = taskResults.filter((r) => r.stageId === stage.stageId);
  const stageDataResult = stageTaskResults.find(
    (r) => r.resultKind === ResultKind.ResultKindData && r.paginatedResults != null,
  );
  const stageSchemaResult = stageDataResult?.resultSchema
    ? stageDataResult
    : stageTaskResults.find((r) => r.resultKind === ResultKind.ResultKindSchema);

  if (!stageSchemaResult) {
    throw new Error("No schema returned");
  }

  const schemaErrors = stageSchemaResult.errors?.map((e) => e.text);
  if (schemaErrors && schemaErrors.length > 0) {
    throw new Error(schemaErrors.join("; "));
  }

  const fields = stageSchemaResult.resultSchema?.fieldList ?? [];
  const headers = fields
    .map((f) => f.name)
    .filter((n): n is string => typeof n === "string");

  const paginated = stageDataResult?.paginatedResults as
    | PaginatedResults
    | undefined;
  const rowArrays = transposeColumnsToRows(paginated?.columns);
  const rows: FleetRow[] = rowArrays.map((row) =>
    Object.fromEntries(headers.map((h, i) => [h, row[i]])),
  );

  return { fields, headers, rows };
}

const DURATION_UNIT_MS: Record<string, number> = {
  ns: 1e-6,
  us: 1e-3,
  µs: 1e-3,
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
};

/**
 * Parse a Go-style duration string (e.g. `20m`, `24h`, `168h`, `1h30m`,
 * `90s`) into milliseconds. Mirrors the subset of `time.ParseDuration` the
 * Go fleet command accepts via `--window`.
 */
export function parseDuration(value: string): number {
  const trimmed = value.trim();
  if (trimmed === "") {
    throw new Error(`Invalid duration: "${value}"`);
  }

  let rest = trimmed;
  let sign = 1;
  if (rest.startsWith("+")) {
    rest = rest.slice(1);
  } else if (rest.startsWith("-")) {
    sign = -1;
    rest = rest.slice(1);
  }

  const partRe = /(\d+(?:\.\d+)?)(ns|us|µs|ms|s|m|h)/g;
  let total = 0;
  let consumed = 0;
  let match: RegExpExecArray | null;
  while ((match = partRe.exec(rest)) !== null) {
    const amount = parseFloat(match[1] ?? "0");
    const unit = match[2] ?? "";
    const factor = DURATION_UNIT_MS[unit];
    if (factor === undefined) {
      throw new Error(`Invalid duration unit: "${unit}"`);
    }
    total += amount * factor;
    consumed += match[0].length;
  }

  if (consumed !== rest.length || consumed === 0) {
    throw new Error(
      `Invalid duration: "${value}". Expected a Go duration like "20m", "24h", or "168h".`,
    );
  }

  return sign * total;
}

/**
 * Compute the fleet query time window, matching the Go CLI: the end time is
 * 15 seconds before now, truncated down to the minute; the start time is the
 * end time minus the requested window. Returns ISO-8601 (RFC 3339) bounds.
 */
export function getFleetTimeRange(
  window: string,
  now: Date = new Date(),
): { startTime: string; endTime: string } {
  const windowMs = parseDuration(window);
  const nowMs = Math.floor(now.getTime() / 1000) * 1000;
  const endMs = Math.floor((nowMs - 15_000) / 60_000) * 60_000;
  const startMs = endMs - windowMs;
  return {
    startTime: new Date(startMs).toISOString(),
    endTime: new Date(endMs).toISOString(),
  };
}
