import * as fs from "node:fs";
import type { MonitorV2Input } from "../../gql/generated/graphql";

/**
 * Read and parse a MonitorV2Input JSON file from disk. The minimal required
 * shape is `{ name, ruleKind, definition }`; the GraphQL backend performs full
 * validation, so this only enforces that the file exists and is valid JSON.
 */
export function readMonitorInput(filePath: string): MonitorV2Input {
  let data: string;
  try {
    data = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`could not read file "${filePath}": ${message}`, {
      cause: error,
    });
  }

  try {
    return JSON.parse(data) as MonitorV2Input;
  } catch {
    throw new Error(`could not parse JSON from "${filePath}"`);
  }
}
