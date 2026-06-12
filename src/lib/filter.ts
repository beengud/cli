export function filterByName<T extends { name: string }>(
  items: T[],
  match?: string,
): T[] {
  if (match === undefined || match === "") {
    return items;
  }
  const needle = match.toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(needle));
}
