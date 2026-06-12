import { describe, test, expect } from "bun:test";
import { renderObject } from "./object";

// Strip ANSI escape codes so assertions are independent of chalk's color state.
function stripAnsi(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/\x1b\[[0-9;]*m/g, "");
}

function render(
  data: object,
  options?: { title?: string; labelWidth?: number },
): string[] {
  const lines: string[] = [];
  renderObject(data, (text) => lines.push(text), options);
  return lines.map(stripAnsi);
}

const SEPARATOR = "-".repeat(60);

describe("renderObject", () => {
  test("renders primitive fields as aligned key-value pairs under a default header", () => {
    const lines = render({ id: "42", name: "foo" });
    expect(lines[0]).toBe("Details");
    expect(lines[1]).toBe(SEPARATOR);
    expect(lines[2]).toBe("Id".padEnd(20) + "42");
    expect(lines[3]).toBe("Name".padEnd(20) + "foo");
    expect(lines[4]).toBe("");
  });

  test("uses a custom title and labelWidth", () => {
    const lines = render({ id: "42" }, { title: "Custom", labelWidth: 10 });
    expect(lines[0]).toBe("Custom");
    expect(lines[1]).toBe(SEPARATOR);
    expect(lines[2]).toBe("Id".padEnd(10) + "42");
  });

  test("skips null and undefined values", () => {
    const lines = render({
      id: "42",
      description: null,
      archivedAt: undefined,
    });
    expect(lines.some((l) => l.includes("Description"))).toBe(false);
    expect(lines.some((l) => l.includes("Archived At"))).toBe(false);
    expect(lines.some((l) => l.includes("42"))).toBe(true);
  });

  test("converts camelCase keys to Title Case and snake_case keys to sentence case", () => {
    const lines = render({ dataset_id: "1", createdBy: "me" });
    // snake_case: underscores become spaces; only the first character is capitalized.
    expect(lines.some((l) => l.trim().startsWith("Dataset id"))).toBe(true);
    // camelCase: each capital letter introduces a new word boundary.
    expect(lines.some((l) => l.trim().startsWith("Created By"))).toBe(true);
  });

  test("grows label width to fit the longest label plus padding", () => {
    const lines = render({ a: "1", veryLongFieldName: "2" }, { labelWidth: 5 });
    // "Very Long Field Name" is 20 chars → padded to 22 (max + 2).
    const match = lines.find((l) =>
      l.trim().startsWith("Very Long Field Name"),
    );
    expect(match).toBeDefined();
    expect(match).toBe("Very Long Field Name".padEnd(22) + "2");
    // "A" is then padded to the same width, not to the `labelWidth` minimum.
    const aLine = lines.find((l) => l.startsWith("A "));
    expect(aLine).toBe("A".padEnd(22) + "1");
  });

  test("nested objects become their own sections titled from the key", () => {
    const lines = render({
      id: "42",
      metadata: { createdBy: "alice", updatedBy: "bob" },
    });

    const detailsIdx = lines.indexOf("Details");
    const metadataIdx = lines.indexOf("Metadata");
    expect(detailsIdx).toBeGreaterThanOrEqual(0);
    expect(metadataIdx).toBeGreaterThan(detailsIdx);
    expect(lines[metadataIdx + 1]).toBe(SEPARATOR);
    expect(
      lines.some(
        (l) => l.trim().startsWith("Created By") && l.includes("alice"),
      ),
    ).toBe(true);
    expect(
      lines.some((l) => l.trim().startsWith("Updated By") && l.includes("bob")),
    ).toBe(true);
  });

  test("array fields render as sub-tables with the item count in the header", () => {
    const lines = render({
      id: "42",
      tags: [
        { key: "env", value: "prod" },
        { key: "region", value: "us" },
      ],
    });
    expect(lines).toContain("Tags (2)");
  });

  test("empty arrays do not produce a section", () => {
    const lines = render({ id: "42", tags: [] });
    expect(lines.some((l) => l.startsWith("Tags"))).toBe(false);
  });

  test("multi-line string values indent continuation lines under the label column", () => {
    const lines = render({ description: "line1\nline2\nline3" });
    const first = lines.findIndex((l) => l.trim().startsWith("Description"));
    expect(first).toBeGreaterThan(-1);
    expect(lines[first]).toBe("Description".padEnd(20) + "line1");
    expect(lines[first + 1]).toBe(" ".repeat(20) + "line2");
    expect(lines[first + 2]).toBe(" ".repeat(20) + "line3");
  });

  test("emits a blank line after each section", () => {
    const lines = render({
      id: "42",
      metadata: { createdBy: "alice" },
      tags: [{ key: "env", value: "prod" }],
    });
    // Blank line after Details.
    expect(lines[lines.indexOf("Details") + 3]).toBe("");
    // Blank line after Metadata.
    const metadataIdx = lines.indexOf("Metadata");
    expect(lines[metadataIdx + 3]).toBe("");
    // Final line after the Tags sub-table is also blank.
    expect(lines[lines.length - 1]).toBe("");
  });
});
