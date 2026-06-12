import chalk from "chalk";
import { fetchLatestRelease } from "./github-release";
import { CURRENT_CLI_VERSION } from "./constants";
import { loadState, saveState } from "./state";

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

function shouldCheckForUpdate(env: Record<string, string | undefined>) {
  // Local dev builds don't have a meaningful version to compare against
  if (CURRENT_CLI_VERSION === "0.0.0-dev") return false;

  // Explicit opt-out
  if (env.OBSERVE_NO_UPDATE_NOTIFIER) return false;

  // Non-interactive sessions (pipes, scripts, CI) don't need notifications
  try {
    if (!process.stderr.isTTY) return false;
  } catch {
    return false;
  }

  // Throttle to one network check per 24 hours
  const state = loadState();
  if (state.lastUpdateCheck) {
    const elapsed = Date.now() - new Date(state.lastUpdateCheck).getTime();
    if (elapsed < CHECK_INTERVAL_MS) return false;
  }

  return true;
}

function compareVersions(current: string, latest: string) {
  const parse = (v: string) => v.replace(/^v/, "").split(".").map(Number);
  const c = parse(current);
  const l = parse(latest);

  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    const cv = c[i] ?? 0;
    const lv = l[i] ?? 0;
    if (lv > cv) return 1;
    if (lv < cv) return -1;
  }
  return 0;
}

async function checkForUpdate({ signal }: { signal?: AbortSignal } = {}) {
  const { version: latestVersion, url: releaseUrl } = await fetchLatestRelease({
    signal,
  });

  saveState({
    lastUpdateCheck: new Date().toISOString(),
    latestKnownVersion: latestVersion,
    latestReleaseUrl: releaseUrl,
  });

  if (compareVersions(CURRENT_CLI_VERSION, latestVersion) > 0) {
    return { currentVersion: CURRENT_CLI_VERSION, latestVersion };
  }

  return null;
}

function formatUpdateMessage({
  currentVersion,
  latestVersion,
}: {
  currentVersion: string;
  latestVersion: string;
}) {
  const arrow = chalk.dim("->");
  return [
    "",
    chalk.yellow(
      `A new version of observe is available: ${currentVersion} ${arrow} ${chalk.green(latestVersion)}`,
    ),
    chalk.dim("Run `observe cli upgrade` to update"),
  ].join("\n");
}

export function startBackgroundUpdateCheck(
  env: Record<string, string | undefined>,
) {
  if (!shouldCheckForUpdate(env)) {
    const state = loadState();
    if (
      state.latestKnownVersion &&
      compareVersions(CURRENT_CLI_VERSION, state.latestKnownVersion) > 0
    ) {
      const message = formatUpdateMessage({
        currentVersion: CURRENT_CLI_VERSION,
        latestVersion: state.latestKnownVersion,
      });
      return { getResult: () => Promise.resolve(message) };
    }

    return { getResult: () => Promise.resolve(null) };
  }

  const abort = new AbortController();
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => {
      abort.abort();
      resolve(null);
    }, 150);
  });

  const pending = checkForUpdate({ signal: abort.signal })
    .then((result) =>
      result
        ? formatUpdateMessage({
            currentVersion: result.currentVersion,
            latestVersion: result.latestVersion,
          })
        : null,
    )
    .catch(() => null);

  return {
    getResult: () => Promise.race([pending, timeoutPromise]),
  };
}
