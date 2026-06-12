import chalk from "chalk";

/**
 * Type-safe table formatting utility similar to TanStack Table's column accessor pattern.
 *
 * Column widths are automatically calculated by scanning all data to find the maximum
 * content width. Columns can be marked as `flex` to take up remaining available space.
 */

/** Default minimum width for any column */
const DEFAULT_MIN_WIDTH = 8;

/**
 * Base column definition interface (internal use).
 * Contains all column options except accessor/format which need special typing.
 */
export interface ColumnDefBase {
  header: string;
  /** Whether this column should expand to fill available space (default: false) */
  flex?: boolean;
  /** Minimum width for the column (default: 8) */
  minWidth?: number;
  /** Maximum width for the column. Caps the auto-calculated content width. */
  maxWidth?: number;
  /** Maximum number of lines for wrapping (default: 1, truncates). Set > 1 to enable wrapping. */
  maxLines?: number;
}

/**
 * Column definition with typed accessor and format functions.
 *
 * When TValue is not specified, it defaults to `unknown`. This is used for:
 * - Arrays of columns with mixed value types
 * - Internal functions that work with any column
 *
 * Use `createColumnHelper()` to get proper type inference for the format function.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ColumnDef<TData, TValue = any> extends ColumnDefBase {
  /** Accessor function to extract value from row */
  accessorFn: (row: TData) => TValue;
  /** Format function receives the raw value from accessor and returns a styled string for display */
  format?: (value: TValue, row: TData) => string;
}

/**
 * Column helper for creating type-safe column definitions.
 * Similar to TanStack Table's createColumnHelper pattern.
 *
 * The TValue type is inferred from the accessorFn return type and flows to format.
 *
 * @example
 * ```ts
 * const columns = createColumnHelper<Dataset>();
 *
 * const col = columns.accessor((row) => row.isActive, {
 *   header: "ACTIVE",
 *   format: (value) => value ? "Yes" : "No",  // value is inferred as boolean
 * });
 * ```
 */
export interface ColumnHelper<TData> {
  /**
   * Create a column with an accessor function. The value type is inferred from the accessor's return type.
   */
  accessor: <TValue>(
    accessorFn: (row: TData) => TValue,
    column: ColumnDefBase & {
      /** Format function receives the raw value from accessor and returns a styled string for display */
      format?: (value: TValue, row: TData) => string;
    },
  ) => ColumnDef<TData>;
}

/**
 * Create a column helper for a specific data type.
 * This provides proper type inference for accessor and format functions.
 *
 * @example
 * ```ts
 * interface Dataset {
 *   id: string;
 *   name: string;
 *   isActive: boolean;
 *   updatedAt: Date | null;
 * }
 *
 * const columns = createColumnHelper<Dataset>();
 *
 * const tableColumns = [
 *   columns.accessor((row) => row.id, { header: "ID" }),
 *   columns.accessor((row) => row.name, { header: "NAME", flex: true }),
 *   columns.accessor((row) => row.isActive, {
 *     header: "ACTIVE",
 *     format: (value) => value ? "Yes" : "No",  // value is boolean
 *   }),
 *   columns.accessor((row) => row.updatedAt, {
 *     header: "UPDATED",
 *     format: (value) => value?.toISOString() ?? "N/A",  // value is Date | null
 *   }),
 * ];
 * ```
 */
export function createColumnHelper<TData>(): ColumnHelper<TData> {
  return {
    accessor: (accessorFn, column) => ({
      ...column,
      accessorFn,
    }),
  };
}

/** Options for table formatting */
export interface FormatTableOptions {
  /** Character to use for separator line (default: "-") */
  separatorChar?: string;
  /** Whether to show the separator line (default: true) */
  showSeparator?: boolean;
  /** Style function for header row */
  headerStyle?: (text: string) => string;
  /** Style function for separator line */
  separatorStyle?: (text: string) => string;
  /** Maximum table width (default: terminal width or 120) */
  maxWidth?: number;
}

/**
 * Truncate a string and add ellipsis if needed
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

/**
 * Pad a string to the right
 */
function padRight(str: string, length: number): string {
  return str.padEnd(length);
}

/**
 * Wrap text into multiple lines of a given width.
 * Returns an array of lines, truncating with ellipsis on the last line if maxLines is exceeded.
 */
function wrapText(str: string, width: number, maxLines: number): string[] {
  if (str.length <= width) {
    return [str];
  }

  const lines: string[] = [];
  let remaining = str;

  while (remaining.length > 0 && lines.length < maxLines) {
    if (lines.length === maxLines - 1 && remaining.length > width) {
      // Last allowed line and still more content - truncate with ellipsis
      lines.push(truncate(remaining, width));
      break;
    } else if (remaining.length <= width) {
      lines.push(remaining);
      break;
    } else {
      lines.push(remaining.slice(0, width));
      remaining = remaining.slice(width);
    }
  }

  return lines;
}

/**
 * Get the terminal width, with a fallback default
 */
function getTerminalWidth(): number {
  return process.stdout.columns || 120;
}

/**
 * Get the raw value from a row using the column accessor
 */
function getRawValue<TData>(row: TData, col: ColumnDef<TData>): unknown {
  return col.accessorFn(row);
}

/**
 * Convert a raw value to a display string
 */
function valueToString(rawValue: unknown): string {
  if (rawValue == null) return "";
  if (typeof rawValue === "object") return JSON.stringify(rawValue);
  if (typeof rawValue === "string") return rawValue;
  return `${rawValue as string | number | boolean | bigint}`;
}

/**
 * Get the string value for a cell (used for width calculation).
 * Applies the format function if present to get the actual display width.
 */
function getCellValue<TData>(row: TData, col: ColumnDef<TData>): string {
  const rawValue = getRawValue(row, col);

  // Apply format function to get actual display value for width calculation
  // The format function receives the raw value and returns a styled string
  if (col.format && rawValue != null) {
    const formatted = col.format(rawValue, row);
    // Strip ANSI codes to get actual visible width
    return stripAnsi(formatted);
  }

  return valueToString(rawValue);
}

/**
 * Strip ANSI escape codes from a string to get visible character count
 */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Calculate column widths by scanning all data.
 *
 * - Non-flex columns: width = max(header, content) + padding, capped by maxWidth, min by minWidth
 * - Flex columns: get their content width as a base, then share remaining space proportionally
 * - If terminal is too small, columns shrink proportionally (respecting minWidth)
 */
function calculateColumnWidths<TData>(
  data: TData[],
  columns: ColumnDef<TData>[],
  tableMaxWidth: number,
): number[] {
  const PADDING = 2; // Space between columns

  // Step 1: Calculate content-based widths for all columns
  const contentWidths = columns.map((col) => {
    // Start with header width
    let maxContentWidth = col.header.length;

    // Scan all data for this column
    for (const row of data) {
      const cellValue = getCellValue(row, col);
      maxContentWidth = Math.max(maxContentWidth, cellValue.length);
    }

    // Add padding
    return maxContentWidth + PADDING;
  });

  // Step 2: Calculate base widths (content-based, with min/max applied)
  const minWidths = columns.map((col) => col.minWidth ?? DEFAULT_MIN_WIDTH);

  const baseWidths = columns.map((col, i) => {
    let width = contentWidths[i] ?? 0;

    // Apply maxWidth cap
    if (col.maxWidth !== undefined) {
      width = Math.min(width, col.maxWidth);
    }

    // Ensure minimum width
    return Math.max(width, minWidths[i] ?? DEFAULT_MIN_WIDTH);
  });

  // Step 3: Calculate how much space flex columns need and how much is available
  const nonFlexTotal = columns.reduce(
    (sum, col, i) => sum + (col.flex ? 0 : (baseWidths[i] ?? 0)),
    0,
  );
  const flexColumns = columns
    .map((col, i) => (col.flex ? i : -1))
    .filter((i) => i >= 0);
  const flexCount = flexColumns.length;

  const finalWidths = [...baseWidths];

  // Step 4: Distribute extra space to flex columns proportionally based on content
  if (flexCount > 0) {
    const flexContentTotal = flexColumns.reduce(
      (sum, i) => sum + (contentWidths[i] ?? 0),
      0,
    );
    const flexBaseTotal = flexColumns.reduce(
      (sum, i) => sum + (baseWidths[i] ?? 0),
      0,
    );
    const availableForFlex = tableMaxWidth - nonFlexTotal;
    const extraSpace = availableForFlex - flexBaseTotal;

    if (extraSpace > 0) {
      // Distribute extra space proportionally based on content width
      for (const colIdx of flexColumns) {
        const col = columns[colIdx];
        if (!col) continue;
        const proportion =
          flexContentTotal > 0
            ? (contentWidths[colIdx] ?? 0) / flexContentTotal
            : 1 / flexCount;
        let flexWidth =
          (baseWidths[colIdx] ?? 0) + Math.floor(extraSpace * proportion);

        // Apply maxWidth cap to flex columns
        if (col.maxWidth !== undefined) {
          flexWidth = Math.min(flexWidth, col.maxWidth);
        }

        finalWidths[colIdx] = flexWidth;
      }
    }
  }

  // Step 5: If total exceeds tableMaxWidth, shrink columns to fit
  // Priority: 1) shrink flex columns first, 2) then shrink largest columns
  let currentTotal = finalWidths.reduce((sum, w) => sum + w, 0);

  if (currentTotal > tableMaxWidth) {
    const excessWidth = currentTotal - tableMaxWidth;

    // First: shrink flex columns only
    if (flexCount > 0) {
      const flexTotal = flexColumns.reduce(
        (sum, i) => sum + (finalWidths[i] ?? 0),
        0,
      );
      const flexMinTotal = flexColumns.reduce(
        (sum, i) => sum + (minWidths[i] ?? 0),
        0,
      );
      const shrinkableFromFlex = flexTotal - flexMinTotal;

      if (shrinkableFromFlex > 0) {
        const shrinkAmount = Math.min(excessWidth, shrinkableFromFlex);
        // Shrink flex columns proportionally
        for (const colIdx of flexColumns) {
          const proportion =
            ((finalWidths[colIdx] ?? 0) - (minWidths[colIdx] ?? 0)) /
            shrinkableFromFlex;
          const colShrink = Math.floor(shrinkAmount * proportion);
          finalWidths[colIdx] = Math.max(
            (finalWidths[colIdx] ?? 0) - colShrink,
            minWidths[colIdx] ?? 0,
          );
        }
      }
    }

    // Second: if still over, shrink the largest columns (any column)
    currentTotal = finalWidths.reduce((sum, w) => sum + w, 0);
    while (currentTotal > tableMaxWidth) {
      // Find the widest column
      let maxIdx = 0;
      let maxWidth = finalWidths[0] ?? 0;
      for (let i = 1; i < finalWidths.length; i++) {
        const w = finalWidths[i] ?? 0;
        if (w > maxWidth) {
          maxIdx = i;
          maxWidth = w;
        }
      }

      // Shrink it by 1
      const currentMaxWidth = finalWidths[maxIdx] ?? 0;
      if (currentMaxWidth > 1) {
        finalWidths[maxIdx] = currentMaxWidth - 1;
        currentTotal--;
      } else {
        // Can't shrink anymore, break to avoid infinite loop
        break;
      }
    }
  }

  return finalWidths;
}

/**
 * Format data as a table string with type-safe column accessors.
 *
 * Column widths are automatically calculated by scanning all data:
 * - Non-flex columns: sized to fit content (header or largest value)
 * - Flex columns: sized to content, then expand proportionally to fill terminal width
 * - All columns respect minWidth (default: 8) and maxWidth if specified
 * - If terminal is too narrow, columns shrink proportionally (respecting minWidth)
 *
 * @example
 * ```ts
 * const table = formatTable(datasets, [
 *   { header: "ID", accessorFn: (row) => row.id },
 *   { header: "NAME", accessorFn: (row) => row.name, flex: true },
 *   { header: "KIND", accessorFn: (row) => row.kind, maxWidth: 30 },
 *   { header: "ACTIVE", accessorFn: (row) => row.active, format: (v) => v ? "Yes" : "No" },
 * ]);
 * ```
 */
export function formatTable<TData>(
  data: TData[],
  columns: ColumnDef<TData>[],
  options: FormatTableOptions = {},
): string {
  const {
    separatorChar = "-",
    showSeparator = true,
    headerStyle = chalk.bold,
    separatorStyle = chalk.dim,
    maxWidth = getTerminalWidth(),
  } = options;

  const lines: string[] = [];

  // Calculate column widths by scanning data
  const columnWidths = calculateColumnWidths(data, columns, maxWidth);

  // Calculate total width for separator
  const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0);

  // Build header rows (wrap headers up to 3 lines, same as data cells)
  const headerMaxLines = 3;
  const headerCellLines: string[][] = columns.map((col, i) => {
    const width = columnWidths[i] ?? 0;
    const contentWidth = Math.max(1, width - 2); // Same padding as data cells, min 1
    return wrapText(col.header, contentWidth, headerMaxLines);
  });

  // Determine max lines for header row
  const headerLineCount = Math.max(
    ...headerCellLines.map((lines) => lines.length),
  );

  // Output each line of the header
  for (let lineIdx = 0; lineIdx < headerLineCount; lineIdx++) {
    const headerRow = columns
      .map((_, colIdx) => {
        const isLast = colIdx === columns.length - 1;
        const width = columnWidths[colIdx] ?? 0;
        const cellLine = headerCellLines[colIdx]?.[lineIdx] ?? "";
        return isLast ? cellLine : padRight(cellLine, width);
      })
      .join("");
    lines.push(headerStyle(headerRow));
  }

  // Add separator
  if (showSeparator) {
    lines.push(separatorStyle(separatorChar.repeat(totalWidth)));
  }

  // Build data rows
  for (const row of data) {
    // Process each cell: get raw value, format once, then truncate/wrap
    const cellData: {
      lines: string[];
      styledLines: string[];
      isNull: boolean;
    }[] = columns.map((col, colIdx) => {
      const width = columnWidths[colIdx] ?? 0;
      const maxLines = col.maxLines ?? 1;
      const contentWidth = Math.max(1, width - 2); // Leave padding space, min 1

      // Get raw value using helper
      const rawValue = getRawValue(row, col);

      // Check for null/undefined
      const isNull = rawValue == null;

      // Get display string and styled string from format function (called once)
      let displayStr: string;
      let styledStr: string;

      if (isNull) {
        displayStr = "null";
        styledStr = chalk.dim.gray("null");
      } else if (col.format) {
        // Format function receives raw value, returns styled string
        styledStr = col.format(rawValue, row);
        displayStr = stripAnsi(styledStr);
      } else {
        displayStr = valueToString(rawValue);
        styledStr = displayStr;
      }

      // Wrap or truncate based on maxLines (using display string for length calc)
      const lines =
        maxLines > 1
          ? wrapText(displayStr, contentWidth, maxLines)
          : [truncate(displayStr, contentWidth)];

      // For styled output, we need to handle truncation specially
      // If content was truncated, we can't just use the styled string
      // Instead, truncate the display string and note if styling should apply
      const styledLines = lines.map((line) => {
        if (isNull) {
          return chalk.dim.gray(line);
        }
        if (!col.format) {
          return line;
        }
        // If line matches start of displayStr, apply styling to the truncated portion
        // This is a simplification - for complex cases, just return the line with basic styling
        if (displayStr === line) {
          return styledStr;
        }
        // Line was truncated - re-apply format to get consistent styling on truncated text
        // Since format expects raw value, we call it and then truncate the result
        const fullStyled = col.format(rawValue, row);
        // Find the styled version of this truncated line
        // Simple approach: just apply the same ANSI codes to the truncated line
        /* eslint-disable no-control-regex */
        const ansiPrefix = /^(\x1b\[[0-9;]*m)*/.exec(fullStyled)?.[0] ?? "";
        const ansiSuffix = /(\x1b\[[0-9;]*m)*$/.exec(fullStyled)?.[0] ?? "";
        /* eslint-enable no-control-regex */
        return ansiPrefix + line + ansiSuffix;
      });

      return { lines, styledLines, isNull };
    });

    // Determine max lines for this row
    const rowLineCount = Math.max(...cellData.map((d) => d.lines.length));

    // Output each line of the row
    for (let lineIdx = 0; lineIdx < rowLineCount; lineIdx++) {
      const rowStr = columns
        .map((_, colIdx) => {
          const isLast = colIdx === columns.length - 1;
          const width = columnWidths[colIdx] ?? 0;

          // Get the styled line for this cell, or empty string if no more lines
          const styledLine = cellData[colIdx]?.styledLines[lineIdx] ?? "";
          const displayLine = cellData[colIdx]?.lines[lineIdx] ?? "";

          // Pad after styling (use display line length for padding calc)
          if (isLast) {
            return styledLine;
          }
          const paddingNeeded = Math.max(0, width - displayLine.length);
          return styledLine + " ".repeat(paddingNeeded);
        })
        .join("");
      lines.push(rowStr);
    }
  }

  return lines.join("\n") + "\n";
}
