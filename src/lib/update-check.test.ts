import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { getConfigDir } from "./config";
import { CONFIG_FILES } from "./constants";
import { startBackgroundUpdateCheck } from "./update-check";

describe("startBackgroundUpdateCheck", () => {
  const statePath = join(getConfigDir(), CONFIG_FILES.state.name);
  let hadExistingState = false;
  let existingState: string | undefined;

  beforeEach(() => {
    if (existsSync(statePath)) {
      hadExistingState = true;
      existingState = readFileSync(statePath, "utf-8");
    }
    try {
      rmSync(statePath);
    } catch {
      // may not exist
    }
  });

  afterEach(() => {
    try {
      rmSync(statePath);
    } catch {
      // may not exist
    }
    if (hadExistingState && existingState) {
      writeFileSync(statePath, existingState);
    }
  });

  test("skips check when OBSERVE_NO_UPDATE_NOTIFIER is set", async () => {
    const result = startBackgroundUpdateCheck({
      OBSERVE_NO_UPDATE_NOTIFIER: "1",
    });

    expect(await result.getResult()).toBeNull();
  });

  test("skips check for dev builds", async () => {
    // CURRENT_CLI_VERSION is "0.0.0-dev" in test environment
    const result = startBackgroundUpdateCheck({});

    expect(await result.getResult()).toBeNull();
  });

  test("returns null when no cached version and check is skipped", async () => {
    const stateDir = getConfigDir();
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(
      statePath,
      JSON.stringify({ lastUpdateCheck: new Date().toISOString() }),
    );

    const result = startBackgroundUpdateCheck({});

    expect(await result.getResult()).toBeNull();
  });
});
