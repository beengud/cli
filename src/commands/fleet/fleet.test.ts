import { describe, expect, test } from "bun:test";
import { parseWindow } from "./fleet";

// parseWindow is re-exported from lib/parsers (parseDurationMs); these tests
// guard the fleet --window contract specifically.
describe("fleet parseWindow", () => {
  test("parses minutes", () => {
    expect(parseWindow("20m")).toBe(20 * 60 * 1000);
  });

  test("parses hours", () => {
    expect(parseWindow("168h")).toBe(168 * 60 * 60 * 1000);
  });

  test("parses seconds and milliseconds", () => {
    expect(parseWindow("90s")).toBe(90 * 1000);
    expect(parseWindow("500ms")).toBe(500);
  });

  test("tolerates surrounding whitespace", () => {
    expect(parseWindow("  24h ")).toBe(24 * 60 * 60 * 1000);
  });

  test("throws on an invalid duration", () => {
    expect(() => parseWindow("20")).toThrow(/Invalid duration/);
    expect(() => parseWindow("abc")).toThrow(/Invalid duration/);
  });
});
