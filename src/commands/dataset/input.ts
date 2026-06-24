import * as fs from "node:fs";
import { z } from "zod";
import type {
  DatasetInput,
  MultiStageQueryInput,
} from "../../gql/generated/graphql";

/**
 * Shape of the JSON file accepted by `dataset dry-run` and `dataset impact`.
 * Mirrors the input contract of the legacy Go CLI:
 *
 *   { "workspaceId": "...",
 *     "dataset": { "name": "..." },
 *     "query": { "stageQueries": [{ "stageID": "...", "pipeline": "..." }] } }
 */
const StageQuerySchema = z.object({
  stageID: z.string().min(1, "query.stageQueries[].stageID is required"),
  pipeline: z.string(),
});

const DatasetCmdInputSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId is required"),
  dataset: z.object({
    name: z.string().min(1, "dataset.name is required"),
  }),
  query: z.object({
    stageQueries: z
      .array(StageQuerySchema)
      .min(1, "query.stageQueries must contain at least one stage"),
  }),
});

export type DatasetCmdInput = z.infer<typeof DatasetCmdInputSchema>;

/** GraphQL variables derived from a parsed input file. */
export interface DatasetCmdVariables {
  workspaceId: string;
  dataset: DatasetInput;
  query: MultiStageQueryInput;
}

/**
 * Read and parse a dataset command input file, then map it onto the GraphQL
 * schema types. The input's `dataset.name` becomes `DatasetInput.label`, and
 * each `stageQueries[].stageID` becomes a `StageQueryInput.id`. The pipeline's
 * `outputStage` defaults to the id of the last stage, matching how the server
 * treats the terminal stage as the dataset output.
 */
export function readDatasetInput(
  filePath: string,
  deps: { readFileSync?: typeof fs.readFileSync } = {},
): DatasetCmdVariables {
  const { readFileSync = fs.readFileSync } = deps;

  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`could not read file "${filePath}": ${message}`, {
      cause: error,
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`could not parse JSON from "${filePath}": ${message}`, {
      cause: error,
    });
  }

  const result = DatasetCmdInputSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `invalid dataset input: ${result.error.issues
        .map((i) => i.message)
        .join(", ")}`,
    );
  }
  const input = result.data;

  const stages = input.query.stageQueries.map((stage) => ({
    id: stage.stageID,
    pipeline: stage.pipeline,
    input: [],
  }));
  // The terminal stage is the dataset's output stage. The schema guarantees at
  // least one stage, so `lastStage` is always defined here.
  const lastStage = stages[stages.length - 1];
  const outputStage = lastStage ? lastStage.id : "";

  return {
    workspaceId: input.workspaceId,
    dataset: { label: input.dataset.name },
    query: { outputStage, stages },
  };
}
