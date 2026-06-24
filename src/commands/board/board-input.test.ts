import { describe, expect, test } from "bun:test";
import type { Config } from "../../lib/config";
import { boardViewURL, normalizeStages } from "./board-input";

describe("normalizeStages", () => {
  test("renames stageID to id and defaults missing input to []", () => {
    const input = normalizeStages({
      stages: [
        {
          stageID: "stage-abc",
          pipeline: "limit 10",
          input: [{ inputName: "main", datasetId: "1" }],
        },
        { stageID: "stage-xyz", pipeline: "limit 5" },
      ],
    });

    const stages = input.stages as Record<string, unknown>[];
    for (const stage of stages) {
      expect("stageID" in stage).toBe(false);
      expect("id" in stage).toBe(true);
    }
    expect(stages[0]!.id).toBe("stage-abc");
    expect(stages[1]!.id).toBe("stage-xyz");
    // stage with no input gets an empty array
    expect(stages[1]!.input).toEqual([]);
  });

  test("defaults stageId and inputRole on each dataset input", () => {
    const input = normalizeStages({
      stages: [
        {
          stageID: "stage-abc",
          pipeline: "limit 10",
          input: [
            { inputName: "main", datasetId: "42450595" },
            {
              inputName: "other",
              datasetId: "42450596",
              stageId: "stage-xyz",
            },
          ],
        },
      ],
    });

    const inputs = (input.stages as Record<string, unknown>[])[0]!
      .input as Record<string, unknown>[];
    // First entry had no stageId or inputRole — normalized
    expect(inputs[0]!.stageId).toBe("");
    expect(inputs[0]!.inputRole).toBe("Data");
    // Second entry preserved its stageId; inputRole still defaulted
    expect(inputs[1]!.stageId).toBe("stage-xyz");
    expect(inputs[1]!.inputRole).toBe("Data");
  });

  test("does not overwrite an existing id when stageID also present", () => {
    const input = normalizeStages({
      stages: [{ id: "real-id", stageID: "old-id", pipeline: "limit 1" }],
    });
    const stage = (input.stages as Record<string, unknown>[])[0]!;
    expect(stage.id).toBe("real-id");
    expect("stageID" in stage).toBe(false);
  });
});

describe("boardViewURL", () => {
  test("builds the workspace/dashboard URL from config", () => {
    const config = {
      customerId: "109601619518",
      domain: "observeinc.com",
      token: "t",
    } as Config;
    expect(boardViewURL(config, "42379913", "43102612")).toBe(
      "https://109601619518.observeinc.com/workspace/42379913/dashboard/43102612",
    );
  });
});
