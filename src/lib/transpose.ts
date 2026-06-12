export function transposeColumnsToRows<T>(columns?: T[][]): T[][] {
  if (!columns || columns.length === 0) {
    return [];
  }

  const numCols = columns.length;
  const numRows = columns[0]?.length ?? 0;

  const rows = new Array<T[]>(numRows);
  for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
    const row = new Array<T>(numCols);
    rows[rowIndex] = row;
    for (let columnIndex = 0; columnIndex < numCols; columnIndex++) {
      row[columnIndex] = columns[columnIndex]?.[rowIndex] as T;
    }
  }

  return rows;
}
