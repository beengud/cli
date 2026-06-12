export function parseNonNegativeInt(value: string): number {
  const num = Number(value);
  if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
    throw new Error("Value must be a non-negative integer");
  }
  return num;
}
