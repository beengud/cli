/**
 * Render data as CSV in whichever shape fits the input. Used everywhere we
 * have `format === "csv"` so the CSV path — like `JSON.stringify` for
 * `--format json` — always serializes the raw payload rather than the
 * table's display columns.
 *
 * - `object[]` → tabular CSV. Headers are the first row's top-level keys;
 *   complex cell values are JSON-encoded. Empty array → empty string.
 * - `object` → property/value CSV with nested keys flattened via dot notation.
 */
export function renderAsCSV(data: object): string {
  if (Array.isArray(data)) {
    const rows = data as readonly object[];
    if (rows.length === 0) return "";
    const first = rows[0];
    if (!first || typeof first !== "object") return "";
    const headers = Object.keys(first);
    const lines = [headers.map(escapeCSV).join(",")];
    for (const row of rows) {
      const rec = row as Record<string, unknown>;
      lines.push(
        headers.map((h) => escapeCSV(csvCellToString(rec[h]))).join(","),
      );
    }
    return lines.join("\n") + "\n";
  }

  const lines = ["property,value"];
  for (const [key, value] of flattenObject(data)) {
    lines.push(`${key},${escapeCSV(csvCellToString(value))}`);
  }
  return lines.join("\n") + "\n";
}

/**
 * CSV rendering (lossless — mirrors JSON.stringify semantics).
 *
 * The CSV path is intended to serialize the raw API/network payload the
 * same way `JSON.stringify` does for `--format json`, NOT the lossy
 * display-time values produced by `valueToString` in `./object.ts`.
 */

/** Escape a string for a CSV field per RFC 4180. */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Stringify a CSV cell losslessly: primitives as-is, `Date` as ISO-8601, and
 * everything else JSON-encoded so nested structures round-trip through CSV
 * the same way they do through JSON. `null`/`undefined` → empty cell.
 */
function csvCellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

/**
 * Flatten a nested object into dot-notation key/value pairs. Arrays are
 * preserved intact as values (the caller decides how to render them).
 *
 * `{a: {b: 1}, c: [1, 2]}` → `[["a.b", 1], ["c", [1, 2]]]`
 */
function flattenObject(obj: object, prefix = ""): [string, unknown][] {
  const result: [string, unknown][] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      result.push(...flattenObject(value as object, fullKey));
    } else {
      result.push([fullKey, value]);
    }
  }
  return result;
}
