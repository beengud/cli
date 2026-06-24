import type { Writer } from "../../lib/writer";
import type { FleetQueryResult, FleetRow } from "./run-query";
import type { GqlDatasetQueryField } from "../../gql/dataset/dataset-query-output";
import { DataType } from "../../gql/generated/graphql";
import { formatTable, type ColumnDef } from "../../lib/formatters/table";
import { valueToString } from "../../lib/formatters/value";
import { renderAsCSV } from "../../lib/formatters/csv";
import { cyan, green, muted, red, yellow } from "../../lib/formatters/colors";

export type FleetOutputFormat = "table" | "json" | "csv";

/**
 * Render a parsed fleet query result in the requested format. Column order is
 * preserved from the OPAL `pick_col`/output schema (matching the Go CLI's
 * table columns), and row order from the OPAL `sort`. `table` is the default
 * human-readable view; `json` and `csv` emit the raw row records.
 */
export function writeFleetResult(
  writer: Writer,
  result: FleetQueryResult,
  format: FleetOutputFormat,
): void {
  const { headers, fields, rows } = result;

  if (format === "csv") {
    writer.write(renderAsCSV(rows));
    return;
  }

  if (format === "json") {
    writer.write(JSON.stringify(rows, null, 2));
    return;
  }

  if (rows.length === 0) {
    writer.info("No results");
    return;
  }

  const fieldMap = new Map<string, GqlDatasetQueryField>();
  for (const field of fields) {
    if (field.name) fieldMap.set(field.name, field);
  }

  const columns: ColumnDef<FleetRow>[] = headers.map((h) => ({
    header: h,
    accessorFn: (row) => row[h],
    format: getFieldFormatter(fieldMap.get(h)),
    maxLines: 3,
  }));

  writer.write("\n" + formatTable(rows, columns));
  writer.info(`\n${rows.length} row(s)`);
}

/**
 * Get a formatter for a field based on its result type, mirroring the
 * coloring used by the `query` command so fleet tables look consistent.
 */
function getFieldFormatter(
  field?: GqlDatasetQueryField,
): ((value: unknown) => string) | undefined {
  if (!field) return undefined;

  switch (field.type.tag) {
    case DataType.Int64:
    case DataType.Float64:
      return (v) => cyan(valueToString(v));
    case DataType.Bool:
      return (v) => (isTruthyBool(v) ? green("true") : red("false"));
    case DataType.Timestamp:
      return (v) => muted(valueToString(v));
    case DataType.Object:
    case DataType.Variant:
    case DataType.Array:
      return (v) => yellow(valueToString(v));
    default:
      return undefined;
  }
}

/**
 * The server encodes scalar values as strings in PaginatedResults, so "false"
 * arrives as a truthy string. Treat the string "true" (or a real boolean) as
 * true; everything else is false.
 */
function isTruthyBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}
