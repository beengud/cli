import { randomUUID } from "node:crypto";
import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import { ensureConfigDir, getConfigDir } from "./config";
import { CONFIG_FILES } from "./constants";

const StateSchema = z.object({
  installedVersion: z.string().optional(),
  installMethod: z.string().optional(),
  installPath: z.string().optional(),
  installedAt: z.string().optional(),
  installOs: z.string().optional(),
  installArch: z.string().optional(),
  lastUpdateCheck: z.string().optional(),
  latestKnownVersion: z.string().optional(),
  latestReleaseUrl: z.string().optional(),
  installId: z.string().optional(),
});

export type State = z.infer<typeof StateSchema>;

function getStatePath() {
  return path.join(getConfigDir(), CONFIG_FILES.state.name);
}

export function loadState(): State {
  const statePath = getStatePath();

  if (!fs.existsSync(statePath)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(statePath, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    const result = StateSchema.safeParse(parsed);
    return result.success ? result.data : {};
  } catch {
    return {};
  }
}

export function getInstallId() {
  const state = loadState();
  if (state.installId) {
    return state.installId;
  }
  const id = randomUUID();
  saveState({ installId: id });
  return id;
}

export function saveState(patch: Partial<State>) {
  ensureConfigDir();
  const statePath = getStatePath();

  const current = loadState();
  const merged = { ...current, ...patch };

  fs.writeFileSync(statePath, JSON.stringify(merged, null, 2), {
    mode: CONFIG_FILES.state.mode,
  });
}
