import chalk from "chalk";
import { formatTable } from "./table.js";
import { valueToString } from "./value.js";

/**
 * Render an object to the terminal. Primitive fields become aligned
 * key-value pairs, nested objects become their own sections, and arrays
 * become sub-tables.
 */
export function renderObject(
  data: object,
  write: (text: string) => void,
  options: { title?: string; labelWidth?: number } = {},
) {
  const { title = "Details", labelWidth = 20 } = options;

  const sections = collectSections(data, title);

  for (const section of sections.primitives) {
    renderSectionHeader(write, section.title);
    renderKeyValuePairs(write, section.entries, labelWidth);
    write("");
  }

  for (const section of sections.arrays) {
    if (section.items.length === 0) continue;

    renderSectionHeader(write, section.title, section.items.length);
    renderArrayAsTable(write, section.items);
    write("");
  }
}

/** Convert `camelCase` or `snake_case` to `Title Case`. */
function keyToLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function renderSectionHeader(
  write: (text: string) => void,
  title: string,
  count?: number,
): void {
  const header = count !== undefined ? `${title} (${count})` : title;
  write(chalk.bold(header));
  write(chalk.dim("-".repeat(60)));
}

/**
 * Render key-value pairs for a section. Label width grows with the longest
 * label in the section, clamped to at least `minLabelWidth`.
 */
function renderKeyValuePairs(
  write: (text: string) => void,
  entries: [string, unknown][],
  minLabelWidth: number,
): void {
  const labels = entries.map(([key]) => keyToLabel(key));
  const maxLabelLen = Math.max(...labels.map((l) => l.length));
  const labelWidth = Math.max(minLabelWidth, maxLabelLen + 2);

  for (const [key, value] of entries) {
    const strValue = valueToString(value);
    if (!strValue) continue;
    const label = keyToLabel(key);

    const lines = strValue.split("\n");
    if (lines.length > 1) {
      write(chalk.dim(label.padEnd(labelWidth)) + (lines[0] ?? ""));
      const indent = " ".repeat(labelWidth);
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line?.trim()) {
          write(indent + line);
        }
      }
    } else {
      write(chalk.dim(label.padEnd(labelWidth)) + strValue);
    }
  }
}

/** Render an array as a table with columns auto-derived from the first item. */
function renderArrayAsTable(write: (text: string) => void, items: unknown[]) {
  if (items.length === 0) return;

  const first = items[0];
  if (typeof first !== "object" || first === null) {
    for (const item of items) {
      write(`  ${valueToString(item)}`);
    }
    return;
  }

  const keys = Object.keys(first);
  const records = items.filter(
    (item): item is Record<string, unknown> =>
      typeof item === "object" && item !== null,
  );

  const columns = keys.map((key) => ({
    header: key.toUpperCase(),
    accessorFn: (row: Record<string, unknown>) => valueToString(row[key]),
  }));

  write(formatTable(records, columns));
}

/**
 * Split an object into section groups: one bucket of key-value pairs (with
 * nested objects recursively merged in) and one bucket of arrays (which
 * become sub-tables).
 */
function collectSections(
  data: object,
  title: string,
): {
  primitives: { title: string; entries: [string, unknown][] }[];
  arrays: { title: string; items: unknown[] }[];
} {
  const result: {
    primitives: { title: string; entries: [string, unknown][] }[];
    arrays: { title: string; items: unknown[] }[];
  } = {
    primitives: [],
    arrays: [],
  };

  const currentPrimitives: [string, unknown][] = [];
  const nestedSections: (typeof result)[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      result.arrays.push({ title: keyToLabel(key), items: value });
    } else if (value != null && typeof value === "object") {
      nestedSections.push(collectSections(value as object, keyToLabel(key)));
    } else {
      currentPrimitives.push([key, value]);
    }
  }

  if (currentPrimitives.length > 0) {
    result.primitives.push({ title, entries: currentPrimitives });
  }

  for (const nested of nestedSections) {
    result.primitives.push(...nested.primitives);
    result.arrays.push(...nested.arrays);
  }

  return result;
}
