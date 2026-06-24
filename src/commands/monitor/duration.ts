/**
 * Parse a lookback duration string into milliseconds. Mirrors the Go CLI's
 * `--since` semantics (Go-style durations), extended with `d` for days which
 * the Go flag also accepted. Supported units: `s`, `m`, `h`, `d`. A bare
 * number is treated as seconds.
 */
const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function parseDurationMs(value: string): number {
  const match = /^(\d+)\s*([smhd])?$/.exec(value.trim());
  if (!match) {
    throw new Error(
      `Invalid duration "${value}". Use a number with an optional unit s|m|h|d (e.g. 24h, 7d).`,
    );
  }
  const amount = Number(match[1]);
  const unit = match[2] ?? "s";
  return amount * (UNIT_MS[unit] ?? 1000);
}
