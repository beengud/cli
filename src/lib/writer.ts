import chalk from "chalk";

/**
 * Lightweight CLI output that centralizes quiet-mode checks and
 * formatting (chalk prefixes, stream routing).
 *
 * - write/info/success/warn go to stdout, suppressed by quiet
 * - error always goes to stderr, never suppressed
 */
export interface Writer {
  /** Raw passthrough to stdout (suppressed by quiet) */
  write(msg: string): void;
  /** Dimmed status message */
  info(msg: string): void;
  success(msg: string): void;
  warn(msg: string): void;
  /** Always writes to stderr, never suppressed */
  error(msg: string): void;
}

export function createWriter({
  process,
  quiet = false,
}: {
  process: {
    stdout: { write(s: string): unknown };
    stderr: { write(s: string): unknown };
  };
  quiet?: boolean;
}): Writer {
  return {
    write(msg: string) {
      if (!quiet) process.stdout.write(msg + "\n");
    },
    info(msg: string) {
      if (!quiet) process.stdout.write(chalk.dim(msg) + "\n");
    },
    success(msg: string) {
      if (!quiet) process.stdout.write(chalk.green("✓") + ` ${msg}\n`);
    },
    warn(msg: string) {
      if (!quiet) process.stdout.write(chalk.yellow("⚠") + ` ${msg}\n`);
    },
    error(msg: string) {
      process.stderr.write(chalk.red("✗") + ` ${msg}\n`);
    },
  };
}

/**
 * Wrap a writer so that status chatter (info/success/warn) becomes a no-op.
 * `write` and `error` pass through unchanged.
 *
 * Use in commands that emit structured output (e.g. --format json|csv) where
 * any extra stdout content would corrupt the machine-readable payload.
 */
export function muteStatusWriter(
  writer: Writer,
  { muted = true }: { muted?: boolean } = {},
): Writer {
  if (!muted) return writer;
  const noop = () => {
    return;
  };
  return {
    ...writer,
    info: noop,
    success: noop,
    warn: noop,
  };
}
