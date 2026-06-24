import { readFileSync } from "node:fs";
import { getApiBaseUrl, type Config } from "../../lib/config";

/**
 * Fields the Observe API returns on a Dashboard but rejects as input to the
 * saveDashboard mutation. They are stripped before sending.
 */
const READ_ONLY_BOARD_FIELDS = ["updatedDate"] as const;

type JsonObject = Record<string, unknown>;

function isObject(v: unknown): v is JsonObject {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Read a DashboardInput JSON file and normalize it for the saveDashboard
 * mutation.
 *
 * StageQueryInput uses "id" for the user-defined stage label (the deprecated
 * field name "stageID" appears in older board exports). If the rename is not
 * applied, the API silently ignores the label and generates random IDs, which
 * breaks every layout card.stageId reference (panels render blank).
 *
 * Each stage's "input" must be present ([] when there is no dataset input),
 * and every InputDefinitionInput needs stageId/inputRole defaulted so the
 * stored values are non-null (read-back queries require String!/InputRole!).
 */
export function readBoardInput(filePath: string): JsonObject {
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`could not read file "${filePath}": ${message}`);
  }

  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`could not parse JSON from "${filePath}": ${message}`);
  }

  if (!isObject(input)) {
    throw new Error(`board input from "${filePath}" must be a JSON object`);
  }

  for (const field of READ_ONLY_BOARD_FIELDS) {
    delete input[field];
  }

  return normalizeStages(input);
}

/** Normalize the stages array in place (exported for testing). */
export function normalizeStages(input: JsonObject): JsonObject {
  const stages = input["stages"];
  if (!Array.isArray(stages)) {
    return input;
  }

  for (const s of stages) {
    if (!isObject(s)) {
      continue;
    }

    // StageQueryInput.id holds the stage label; rename the deprecated "stageID".
    if ("stageID" in s) {
      if (!("id" in s)) {
        s["id"] = s["stageID"];
      }
      delete s["stageID"];
    }

    // DashboardStageInput requires "input" to be defined; default to [].
    if (!("input" in s)) {
      s["input"] = [];
    }

    const inputs = s["input"];
    if (Array.isArray(inputs)) {
      for (const inp of inputs) {
        if (!isObject(inp)) {
          continue;
        }
        // stageId: String! and inputRole: InputRole! must be non-null on read.
        if (!("stageId" in inp)) {
          inp["stageId"] = "";
        }
        if (!("inputRole" in inp)) {
          inp["inputRole"] = "Data";
        }
      }
    }
  }

  return input;
}

/**
 * The Observe UI URL for viewing a dashboard.
 * Pattern: https://{customerid}.{domain}/workspace/{workspaceId}/dashboard/{boardId}
 */
export function boardViewURL(
  config: Config,
  workspaceId: string,
  boardId: string,
): string {
  const base = getApiBaseUrl(config);
  return `${base}/workspace/${workspaceId}/dashboard/${boardId}`;
}

/** Template emitted by `board scaffold` as a starting point for board JSON. */
export function boardScaffoldTemplate(name = "My Dashboard"): JsonObject {
  return {
    name,
    workspaceId: "YOUR_WORKSPACE_ID",
    visibility: "Listed",
    layout: {
      autoPack: true,
      gridLayout: {
        sections: [
          {
            card: { title: "Section", closed: false, cardType: "section" },
            items: [
              {
                card: { stageId: "stage-abc123", cardType: "stage" },
                layout: { h: 12, w: 12, x: 0, y: 0 },
              },
            ],
          },
        ],
      },
      stageListLayout: {
        timeRange: {
          display: "Past 24 hours",
          millisFromCurrentTime: 86400000,
          timeRangeInfo: {
            key: "PRESETS",
            name: "Presets",
            presetType: "PAST_24_HOURS",
          },
        },
        isModified: false,
        parameters: [],
      },
    },
    stages: [
      {
        stageID: "stage-abc123",
        pipeline: "limit 100",
        input: [{ inputName: "main", datasetId: "YOUR_DATASET_ID" }],
      },
    ],
  };
}
