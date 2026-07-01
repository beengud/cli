import * as fs from "node:fs";

// Fields returned by the Observe API that are not accepted as input by the
// saveDashboard mutation.
const READ_ONLY_BOARD_FIELDS = ["updatedDate"] as const;

type BoardInput = Record<string, unknown>;

/**
 * Read and normalize a board JSON file for the saveDashboard mutation.
 *
 * These normalizations are load-bearing bug fixes ported verbatim from
 * readBoardInput in the Go fork (cmd_board.go):
 *   - strip top-level read-only fields (updatedDate)
 *   - per stage: rename deprecated "stageID" -> "id" (keeps card.stageId
 *     references valid so panels render); default missing "input" to []
 *   - per stage input entry: inject stageId="" and inputRole="Data" when
 *     absent (both are nullable on write but non-null on read; omitting them
 *     stores null and makes every later board load fail).
 */
export function readBoardInput(filePath: string): BoardInput {
  let data: string;
  try {
    data = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`board: could not read file "${filePath}": ${message}`, {
      cause: error,
    });
  }

  let input: BoardInput;
  try {
    input = JSON.parse(data) as BoardInput;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `board: could not parse JSON from "${filePath}": ${message}`,
      { cause: error },
    );
  }

  for (const field of READ_ONLY_BOARD_FIELDS) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete input[field];
  }

  const stages = input.stages;
  if (Array.isArray(stages)) {
    for (const s of stages) {
      if (typeof s !== "object" || s === null) continue;
      const stage = s as Record<string, unknown>;

      // StageQueryInput uses "id" for the user-defined stage label; older board
      // JSON uses the deprecated "stageID". Rename so the API honors it.
      if ("stageID" in stage) {
        if (!("id" in stage)) {
          stage.id = stage.stageID;
        }
        delete stage.stageID;
      }

      // DashboardStageInput requires "input" defined; send [] not omitted.
      if (!("input" in stage)) {
        stage.input = [];
      }

      const inputs = stage.input;
      if (Array.isArray(inputs)) {
        for (const inp of inputs) {
          if (typeof inp !== "object" || inp === null) continue;
          const entry = inp as Record<string, unknown>;
          if (!("stageId" in entry)) {
            entry.stageId = "";
          }
          if (!("inputRole" in entry)) {
            entry.inputRole = "Data";
          }
        }
      }
    }
  }

  return input;
}
