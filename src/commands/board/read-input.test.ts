import { afterEach, describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { readBoardInput } from "./read-input";

function writeTempBoard(obj: unknown): string {
  const file = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "board-test-")),
    "board.json",
  );
  fs.writeFileSync(file, JSON.stringify(obj));
  return file;
}

const tempFiles: string[] = [];
function temp(obj: unknown): string {
  const f = writeTempBoard(obj);
  tempFiles.push(f);
  return f;
}

afterEach(() => {
  for (const f of tempFiles.splice(0)) {
    fs.rmSync(path.dirname(f), { recursive: true, force: true });
  }
});

describe("readBoardInput normalization", () => {
  test("strips top-level updatedDate", () => {
    const input = readBoardInput(
      temp({ name: "b", workspaceId: "1", updatedDate: "2026-01-01" }),
    );
    expect("updatedDate" in input).toBe(false);
  });

  test("renames stageID to id and drops stageID", () => {
    const input = readBoardInput(
      temp({ stages: [{ stageID: "s1", pipeline: "limit 1", input: [] }] }),
    );
    const stage = (input.stages as Record<string, unknown>[])[0];
    expect(stage.id).toBe("s1");
    expect("stageID" in stage).toBe(false);
  });

  test("does not overwrite an existing id when stageID is also present", () => {
    const input = readBoardInput(
      temp({ stages: [{ id: "keep", stageID: "s1", input: [] }] }),
    );
    const stage = (input.stages as Record<string, unknown>[])[0];
    expect(stage.id).toBe("keep");
    expect("stageID" in stage).toBe(false);
  });

  test("defaults a missing stage input to []", () => {
    const input = readBoardInput(
      temp({ stages: [{ stageID: "s1", pipeline: "limit 1" }] }),
    );
    const stage = (input.stages as Record<string, unknown>[])[0];
    expect(stage.input).toEqual([]);
  });

  test("injects stageId='' and inputRole='Data' on stage input entries", () => {
    const input = readBoardInput(
      temp({
        stages: [
          {
            stageID: "s1",
            input: [{ inputName: "main", datasetId: "42" }],
          },
        ],
      }),
    );
    const stage = (input.stages as Record<string, unknown>[])[0];
    const entry = (stage.input as Record<string, unknown>[])[0];
    expect(entry.stageId).toBe("");
    expect(entry.inputRole).toBe("Data");
  });

  test("preserves explicit stageId and inputRole on input entries", () => {
    const input = readBoardInput(
      temp({
        stages: [
          {
            stageID: "s1",
            input: [
              { inputName: "main", stageId: "other", inputRole: "Reference" },
            ],
          },
        ],
      }),
    );
    const stage = (input.stages as Record<string, unknown>[])[0];
    const entry = (stage.input as Record<string, unknown>[])[0];
    expect(entry.stageId).toBe("other");
    expect(entry.inputRole).toBe("Reference");
  });

  test("throws a descriptive error on invalid JSON", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "board-test-"));
    const file = path.join(dir, "bad.json");
    fs.writeFileSync(file, "{ not json");
    tempFiles.push(file);
    expect(() => readBoardInput(file)).toThrow(/could not parse JSON/);
  });
});
