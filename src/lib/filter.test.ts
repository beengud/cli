import { describe, expect, test } from "bun:test";
import { filterByName } from "./filter";

const items = [
  { id: "1", name: "Host Explorer" },
  { id: "2", name: "Kubernetes Explorer" },
  { id: "3", name: "Logs/OpenTelemetry" },
];

describe("filterByName", () => {
  test("returns all items when name is undefined", () => {
    expect(filterByName(items)).toHaveLength(3);
  });

  test("returns all items when name is empty", () => {
    expect(filterByName(items, "")).toHaveLength(3);
  });

  test("matches a substring", () => {
    const result = filterByName(items, "Explorer");
    expect(result.map((i) => i.id)).toEqual(["1", "2"]);
  });

  test("is case-insensitive", () => {
    expect(filterByName(items, "host")).toHaveLength(1);
    expect(filterByName(items, "HOST")).toHaveLength(1);
  });

  test("returns empty array when nothing matches", () => {
    expect(filterByName(items, "nonexistent")).toEqual([]);
  });
});
