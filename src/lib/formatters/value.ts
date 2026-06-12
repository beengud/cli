/**
 * Format a value for human-readable terminal display. Intentionally lossy:
 *
 * - booleans collapse to `Yes`/`No`
 * - `Date` uses `toLocaleString()`
 * - single-key objects unwrap to their inner primitive
 * - common wrapper shapes (`{name}`, `{tag}`, `{column, path}`) collapse to a
 *   short label
 *
 * Do NOT use this for CSV or JSON serialization — `renderAsCSV` (see
 * `./csv.ts`) and `JSON.stringify` preserve the raw shape. This function is
 * only for table cells and other terminal rendering.
 */
export function valueToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toLocaleString();
  if (Array.isArray(value)) {
    return value.map(valueToString).join(", ");
  }
  if (typeof value === "object") {
    if (Object.keys(value).length === 1) {
      const singleValue: unknown = Object.values(value)[0];
      if (typeof singleValue === "string" || typeof singleValue === "number") {
        return String(singleValue);
      }
    }
    if ("tag" in value && typeof value.tag === "string") return value.tag;
    if ("name" in value && typeof value.name === "string") return value.name;
    if (
      "column" in value &&
      "path" in value &&
      typeof value.column === "string" &&
      Object.keys(value).length === 2
    ) {
      if (typeof value.path === "string" && value.path) {
        return `${value.column}.${value.path}`;
      }
      return value.column;
    }
    return JSON.stringify(value);
  }
  return `${value as string | number | boolean | bigint}`;
}
