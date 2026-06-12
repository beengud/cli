import chalk from "chalk";

const COLORS = {
  red: "#fe4144",
  green: "#83da90",
  yellow: "#FDB81B",
  blue: "#226DFC",
  magenta: "#FF45A8",
  white: "#f9f8f9",
  cyan: "#79B8FF",
  muted: "#898294",
} as const;

// Base Color Functions

export const red = (text: string): string => chalk.hex(COLORS.red)(text);
export const green = (text: string): string => chalk.hex(COLORS.green)(text);
export const yellow = (text: string): string => chalk.hex(COLORS.yellow)(text);
export const blue = (text: string): string => chalk.hex(COLORS.blue)(text);
export const magenta = (text: string): string =>
  chalk.hex(COLORS.magenta)(text);
export const white = (text: string): string => chalk.hex(COLORS.white)(text);
export const cyan = (text: string): string => chalk.hex(COLORS.cyan)(text);
export const muted = (text: string): string => chalk.hex(COLORS.muted)(text);
export const bold = (text: string): string => chalk.bold(text);
export const underline = (text: string): string => chalk.underline(text);
export const boldUnderline = (text: string): string =>
  chalk.bold.underline(text);

// Semantic Helpers

/** Format success messages (green) */
export const success = (text: string): string => green(text);

/** Format error messages (red) */
export const error = (text: string): string => red(text);

/** Format warning messages (yellow) */
export const warning = (text: string): string => yellow(text);

/** Format info messages (cyan) */
export const info = (text: string): string => cyan(text);

/** Format headers and dividers (muted) */
export const header = (text: string): string => muted(text);
