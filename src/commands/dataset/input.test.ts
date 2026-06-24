import { describe, expect, test } from "bun:test";
import { readDatasetInput } from "./input";

function withFile(contents: string) {
  return { readFileSync: () => contents } as Parameters<
    typeof readDatasetInput
  >[1];
}

describe("readDatasetInput", () => {
  test("maps name->label and stageID->id, deriving outputStage", () => {
    const json = JSON.stringify({
      workspaceId: "42379913",
      dataset: { name: "MyDataset" },
      query: {
        stageQueries: [
          { stageID: "a", pipeline: "filter true" },
          { stageID: "main", pipeline: "make_col x:1" },
        ],
      },
    });

    const vars = readDatasetInput("input.json", withFile(json));

    expect(vars).toEqual({
      workspaceId: "42379913",
      dataset: { label: "MyDataset" },
      query: {
        outputStage: "main",
        stages: [
          { id: "a", pipeline: "filter true", input: [] },
          { id: "main", pipeline: "make_col x:1", input: [] },
        ],
      },
    });
  });

  test("throws a read error when the file is missing", () => {
    expect(() =>
      readDatasetInput("missing.json", {
        readFileSync: () => {
          throw new Error("ENOENT");
        },
      }),
    ).toThrow(/could not read file "missing.json"/);
  });

  test("throws a parse error on malformed JSON", () => {
    expect(() => readDatasetInput("bad.json", withFile("not json"))).toThrow(
      /could not parse JSON/,
    );
  });

  test("throws a validation error when stageQueries is empty", () => {
    const json = JSON.stringify({
      workspaceId: "1",
      dataset: { name: "X" },
      query: { stageQueries: [] },
    });
    expect(() => readDatasetInput("input.json", withFile(json))).toThrow(
      /at least one stage/,
    );
  });
});
