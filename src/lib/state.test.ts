import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
import { getConfigDir } from "./config";
import { CONFIG_FILES } from "./constants";
import { loadState, saveState } from "./state";

describe("state", () => {
  const statePath = join(getConfigDir(), CONFIG_FILES.state.name);
  let hadExistingState = false;
  let existingState: string | undefined;

  beforeEach(() => {
    // Preserve any real state file
    if (existsSync(statePath)) {
      hadExistingState = true;
      existingState = readFileSync(statePath, "utf-8");
    }
    // Clean before each test
    try {
      rmSync(statePath);
    } catch {
      // may not exist
    }
  });

  afterEach(() => {
    // Clean up test state
    try {
      rmSync(statePath);
    } catch {
      // may not exist
    }
    // Restore original state if it existed
    if (hadExistingState && existingState) {
      writeFileSync(statePath, existingState);
    }
  });

  describe("loadState", () => {
    test("returns empty object when no state file exists", () => {
      expect(loadState()).toEqual({});
    });

    test("loads valid state file", () => {
      const stateDir = getConfigDir();
      mkdirSync(stateDir, { recursive: true });
      writeFileSync(
        statePath,
        JSON.stringify({
          installedVersion: "1.0.0",
          installMethod: "curl",
        }),
      );

      const state = loadState();
      expect(state.installedVersion).toBe("1.0.0");
      expect(state.installMethod).toBe("curl");
    });

    test("returns empty object for invalid JSON", () => {
      const stateDir = getConfigDir();
      mkdirSync(stateDir, { recursive: true });
      writeFileSync(statePath, "not json{{{");

      expect(loadState()).toEqual({});
    });

    test("returns empty object for wrong schema shape", () => {
      const stateDir = getConfigDir();
      mkdirSync(stateDir, { recursive: true });
      writeFileSync(statePath, JSON.stringify({ installedVersion: 12345 }));

      expect(loadState()).toEqual({});
    });

    test("ignores unknown fields", () => {
      const stateDir = getConfigDir();
      mkdirSync(stateDir, { recursive: true });
      writeFileSync(
        statePath,
        JSON.stringify({
          installedVersion: "1.0.0",
          unknownField: "should be ignored",
        }),
      );

      const state = loadState();
      expect(state.installedVersion).toBe("1.0.0");
      expect((state as Record<string, unknown>).unknownField).toBeUndefined();
    });
  });

  describe("saveState", () => {
    test("creates directory and file when they don't exist", () => {
      saveState({ installedVersion: "1.0.0" });

      expect(existsSync(statePath)).toBe(true);

      const state = loadState();
      expect(state.installedVersion).toBe("1.0.0");
    });

    test("merges with existing state", () => {
      saveState({ installedVersion: "1.0.0", installMethod: "curl" });
      saveState({ installedVersion: "2.0.0" });

      const state = loadState();
      expect(state.installedVersion).toBe("2.0.0");
      expect(state.installMethod).toBe("curl");
    });

    test("preserves all fields on partial update", () => {
      saveState({
        installedVersion: "1.0.0",
        installMethod: "curl",
        installPath: "/usr/local/bin/observe",
        installOs: "darwin",
        installArch: "arm64",
      });

      saveState({ lastUpdateCheck: "2026-04-10T00:00:00Z" });

      const state = loadState();
      expect(state.installedVersion).toBe("1.0.0");
      expect(state.installMethod).toBe("curl");
      expect(state.lastUpdateCheck).toBe("2026-04-10T00:00:00Z");
    });
  });
});
