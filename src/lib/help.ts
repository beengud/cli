/**
 * Custom Help Output
 *
 * Provides a branded, styled help output for the CLI.
 * Shows custom formatting when running `observe` with no arguments.
 * Commands are auto-generated from Stricli's route structure.
 */

import chalk from "chalk";
import { routes } from "../app.js";
import { cyan, magenta, muted } from "./formatters/colors.js";
import type { Writer } from "./writer.js";

/** ASCII art banner rows for gradient coloring */
const BANNER_ROWS = [
  "   ██████╗ ██████╗ ███████╗███████╗██████╗ ██╗   ██╗███████╗",
  "  ██╔═══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝",
  "  ██║   ██║██████╔╝███████╗█████╗  ██████╔╝██║   ██║█████╗  ",
  "  ██║   ██║██╔══██╗╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ",
  "  ╚██████╔╝██████╔╝███████║███████╗██║  ██║ ╚████╔╝ ███████╗",
  "   ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝",
];

/** Blue gradient colors (Observe brand-inspired) */
const BANNER_GRADIENT = [
  "#79B8FF",
  "#6BA8EF",
  "#5D98DF",
  "#4F88CF",
  "#4178BF",
  "#3368AF",
];

/**
 * Format the banner with a vertical gradient effect.
 * Each row gets progressively darker blue.
 */
function formatBanner(): string {
  return BANNER_ROWS.map((row, i) => {
    const color = BANNER_GRADIENT[i] ?? "#79B8FF";
    return chalk.hex(color)(row);
  }).join("\n");
}

const TAGLINE = "The command-line interface for Observe Inc";

interface HelpCommand {
  usage: string;
  description: string;
}

/** Minimal type for route map entries returned by getAllEntries() */
interface RouteMapEntry {
  name: { original: string };
  target: { brief: string };
  hidden: boolean;
}

/**
 * Type guard to check if a routing target is a RouteMap (has subcommands).
 */
function isRouteMap(
  target: unknown,
): target is { getAllEntries: () => RouteMapEntry[]; brief: string } {
  return (
    typeof target === "object" &&
    target !== null &&
    "getAllEntries" in target &&
    typeof target.getAllEntries === "function"
  );
}

/** Stricli positional parameters structure */
interface PositionalParam {
  placeholder?: string;
}
type PositionalParams =
  | { kind: "tuple"; parameters: PositionalParam[] }
  | { kind: "array"; parameter: PositionalParam };

/**
 * Type guard to check if a target is a Command (has parameters).
 */
function isCommand(target: unknown): target is {
  brief: string;
  parameters: { positional?: PositionalParams };
} {
  return (
    typeof target === "object" &&
    target !== null &&
    "parameters" in target &&
    !("getAllEntries" in target)
  );
}

/**
 * Extract placeholder text from a command's positional parameters.
 */
function getPositionalPlaceholder(target: unknown): string {
  if (!isCommand(target)) return "<...>";
  const positional = target.parameters.positional;
  if (!positional) return "";

  if (positional.kind === "tuple" && positional.parameters.length > 0) {
    return positional.parameters
      .map((p, i) => `<${p.placeholder ?? `arg${i}`}>`)
      .join(" ");
  }
  if (positional.kind === "array") {
    return `<${positional.parameter.placeholder ?? "args"}...>`;
  }
  return "<...>";
}

/**
 * Generate the commands list dynamically from Stricli's route structure.
 */
function generateCommands(): HelpCommand[] {
  const entries = routes.getAllEntries();

  return entries
    .filter((entry: RouteMapEntry) => !entry.hidden)
    .map((entry: RouteMapEntry) => {
      const routeName = entry.name.original;
      const brief = entry.target.brief;

      if (isRouteMap(entry.target)) {
        const subEntries = entry.target
          .getAllEntries()
          .filter((sub: RouteMapEntry) => !sub.hidden);
        const subNames = subEntries
          .map((sub: RouteMapEntry) => sub.name.original)
          .join(" | ");
        return {
          usage: `observe ${routeName} ${subNames}`,
          description: brief,
        };
      }

      const placeholder = getPositionalPlaceholder(entry.target);
      const usageSuffix = placeholder ? ` ${placeholder}` : "";
      return {
        usage: `observe ${routeName}${usageSuffix}`,
        description: brief,
      };
    });
}

const DOCS_URL = "https://docs.observeinc.com";

/**
 * Format the command list with aligned descriptions.
 */
function formatCommands(commands: HelpCommand[]): string {
  const maxUsageLength = Math.max(...commands.map((cmd) => cmd.usage.length));
  const padding = 4;

  return commands
    .map((cmd) => {
      const usagePadded = cmd.usage.padEnd(maxUsageLength + padding);
      return `    $ ${cyan(usagePadded)}${muted(cmd.description)}`;
    })
    .join("\n");
}

/**
 * Print the custom branded help output.
 */
export async function printCustomHelp(writer: Writer): Promise<void> {
  const example = "observe auth login";

  const lines: string[] = [];
  lines.push("");
  lines.push(formatBanner());
  lines.push("");
  lines.push(`  ${TAGLINE}`);
  lines.push("");
  lines.push(formatCommands(generateCommands()));
  lines.push("");
  lines.push(`  ${muted("try:")} ${magenta(example)}`);
  lines.push("");
  lines.push(`  ${muted(`Learn more at ${DOCS_URL}`)}`);
  lines.push("");
  lines.push("");

  writer.write(lines.join("\n"));
}
