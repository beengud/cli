export function parseNonNegativeInt(value: string): number {
  const num = Number(value);
  if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
    throw new Error("Value must be a non-negative integer");
  }
  return num;
}

const DURATION_UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/**
 * Parse a Go-style duration (e.g. "20m", "24h", "7d", "90s", "500ms") to
 * milliseconds. Used by `fleet --window`.
 */
export function parseDurationMs(value: string): number {
  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new Error(
      `Invalid duration "${value}"; use a value like 20m, 24h, or 7d`,
    );
  }
  const amount = Number(match[1]);
  const unitMs = DURATION_UNIT_MS[match[2] ?? ""] ?? 0;
  return amount * unitMs;
}
