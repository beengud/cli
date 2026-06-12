import { describe, test, expect } from "bun:test";
import { renderAsCSV } from "./csv";

describe("renderAsCSV", () => {
  describe("array input (tabular)", () => {
    test("returns empty string for an empty array", () => {
      expect(renderAsCSV([])).toBe("");
    });

    test("renders a header row and data rows from the first row's keys", () => {
      const rows = [
        { id: "1", name: "foo" },
        { id: "2", name: "bar" },
      ];
      expect(renderAsCSV(rows)).toBe("id,name\n1,foo\n2,bar\n");
    });

    test("preserves insertion order of keys", () => {
      expect(renderAsCSV([{ b: 1, a: 2, c: 3 }])).toBe("b,a,c\n1,2,3\n");
    });

    test("uses an empty cell when a later row is missing a key from the first row", () => {
      const rows = [{ id: "1", name: "foo" }, { id: "2" }];
      expect(renderAsCSV(rows)).toBe("id,name\n1,foo\n2,\n");
    });

    test("ignores keys that only appear in later rows", () => {
      const rows: Record<string, unknown>[] = [
        { id: "1" },
        { id: "2", extra: "x" },
      ];
      expect(renderAsCSV(rows)).toBe("id\n1\n2\n");
    });

    test("serializes primitive cell values", () => {
      const rows = [
        {
          s: "hello",
          n: 42,
          b: true,
          f: false,
          nul: null,
          un: undefined,
        },
      ];
      expect(renderAsCSV(rows)).toBe("s,n,b,f,nul,un\nhello,42,true,false,,\n");
    });

    test("serializes bigint values", () => {
      const rows = [{ big: BigInt("9007199254740993") }];
      expect(renderAsCSV(rows)).toBe("big\n9007199254740993\n");
    });

    test("serializes Date as ISO-8601", () => {
      const rows = [{ when: new Date("2025-01-02T03:04:05.678Z") }];
      expect(renderAsCSV(rows)).toBe("when\n2025-01-02T03:04:05.678Z\n");
    });

    test("JSON-encodes nested objects in cells", () => {
      const rows = [{ who: { name: "alice", role: "admin" } }];
      expect(renderAsCSV(rows)).toBe(
        `who\n"{""name"":""alice"",""role"":""admin""}"\n`,
      );
    });

    test("JSON-encodes arrays in cells", () => {
      expect(renderAsCSV([{ tags: ["a", "b"] }])).toBe(
        `tags\n"[""a"",""b""]"\n`,
      );
    });

    test("escapes commas, quotes, and newlines per RFC 4180", () => {
      const rows = [{ v: "a,b" }, { v: 'he said "hi"' }, { v: "line1\nline2" }];
      expect(renderAsCSV(rows)).toBe(
        `v\n"a,b"\n"he said ""hi"""\n"line1\nline2"\n`,
      );
    });

    test("single-row arrays still use the tabular path", () => {
      expect(renderAsCSV([{ id: "1" }])).toBe("id\n1\n");
    });
  });

  describe("object input (property/value)", () => {
    test("renders a flat object as property,value rows", () => {
      expect(renderAsCSV({ id: "1", name: "foo" })).toBe(
        "property,value\nid,1\nname,foo\n",
      );
    });

    test("flattens nested objects with dot notation", () => {
      expect(renderAsCSV({ a: { b: { c: 1 }, d: 2 }, e: 3 })).toBe(
        "property,value\na.b.c,1\na.d,2\ne,3\n",
      );
    });

    test("keeps arrays intact as JSON-encoded values", () => {
      expect(renderAsCSV({ tags: ["a", "b"] })).toBe(
        `property,value\ntags,"[""a"",""b""]"\n`,
      );
    });

    test("escapes values containing commas, quotes, and newlines", () => {
      expect(renderAsCSV({ note: 'hello, "world"' })).toBe(
        `property,value\nnote,"hello, ""world"""\n`,
      );
    });

    test("null and undefined become empty cells", () => {
      expect(renderAsCSV({ a: null, b: undefined, c: "x" })).toBe(
        "property,value\na,\nb,\nc,x\n",
      );
    });

    test("empty object produces just the header", () => {
      expect(renderAsCSV({})).toBe("property,value\n");
    });
  });
});
