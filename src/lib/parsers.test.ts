import { describe, expect, test } from "bun:test";
import { parseNonNegativeInt } from "./parsers";

describe("parseNonNegativeInt", () => {
  test("parses zero and positive integers", () => {
    expect(parseNonNegativeInt("0")).toBe(0);
    expect(parseNonNegativeInt("42")).toBe(42);
  });

  test("rejects negatives, non-integers, and non-numbers", () => {
    expect(() => parseNonNegativeInt("-1")).toThrow();
    expect(() => parseNonNegativeInt("1.5")).toThrow();
    expect(() => parseNonNegativeInt("foo")).toThrow();
  });
});
