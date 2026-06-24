/**
 * Render a GraphQL `Time` scalar (typed as `unknown` by codegen, but always an
 * ISO-8601 string at runtime) for display. Non-string values fall back to a
 * placeholder rather than `[object Object]`.
 */
export function timeToDisplay(value: unknown, fallback = "-"): string {
  return typeof value === "string" ? value : fallback;
}
