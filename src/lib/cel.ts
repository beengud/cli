/** Escape regex special characters so a user-provided string is treated as a literal. */
export function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Escape a string for safe interpolation into a CEL double-quoted string
 * literal. Without this, input containing `"` or `\` would break out of the
 * literal and inject arbitrary CEL into the expression sent to the API.
 */
export function escapeCelString(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/**
 * Build a CEL `.matches()` expression for case-insensitive substring matching.
 * Uses the `(?i)` regex flag since some Observe REST APIs (e.g. alerts)
 * don't support `.lowerAscii()`.
 */
export function celMatchesInsensitive(field: string, search: string) {
  return `${field}.matches("(?i)${escapeRegex(search)}")`;
}

/**
 * Build a CEL expression that matches a field against a search term,
 * case-insensitively. Splits the search term on spaces so each word
 * must appear in the field (fuzzy/token matching), OR the full term
 * matches as a substring.
 *
 * Uses `.lowerAscii()` — only works on APIs that support it (e.g. datasets).
 */
export function celFuzzyContains(field: string, search: string) {
  const lowerField = `${field}.lowerAscii()`;
  const fullMatch = `${lowerField}.contains("${escapeCelString(search)}".lowerAscii())`;

  const parts = search.split(" ").filter(Boolean);
  if (parts.length <= 1) {
    return fullMatch;
  }

  const tokenMatch = parts
    .map(
      (part) =>
        `${lowerField}.contains("${escapeCelString(part)}".lowerAscii())`,
    )
    .join(" && ");

  return `(${fullMatch} || (${tokenMatch}))`;
}

/**
 * JS-side equivalent of `celFuzzyContains` for client-side filtering (e.g. on
 * the KG `--correlation-tag-key`/`--correlation-tag-value` path where the
 * server-side CEL filter cannot run).
 *
 * Matches when `haystack` contains the full `needle` as a substring (case
 * insensitive), OR — if `needle` has multiple space-separated tokens — every
 * token appears in `haystack` independently. Keep this in sync with
 * `celFuzzyContains` so native and client-side filtering stay behaviorally
 * equivalent.
 */
export function fuzzyContains(haystack: string, needle: string): boolean {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (h.includes(n)) return true;
  const parts = needle
    .split(" ")
    .filter((p) => p.length > 0)
    .map((p) => p.toLowerCase());
  if (parts.length <= 1) return false;
  return parts.every((p) => h.includes(p));
}
