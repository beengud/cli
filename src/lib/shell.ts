/**
 * Shell detection and configuration utilities.
 *
 * Provides functions for detecting the current shell, finding config files,
 * and modifying PATH in shell configuration.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, delimiter, dirname, join } from "node:path";

export type ShellType = "bash" | "zsh" | "fish" | "sh" | "ash" | "unknown";

export interface ShellInfo {
  /** Detected shell type (e.g. "zsh", "bash", "fish"). */
  type: ShellType;
  /** Display name derived from the shell binary path. */
  name: string;
  /** First existing config file found, or null if none exist. */
  configFile: string | null;
  /** All candidate config file paths checked for this shell type. */
  configCandidates: string[];
}

export interface PathModificationResult {
  /** Whether the config file was actually changed. */
  modified: boolean;
  /** Path to the config file that was written, or null if the write failed. */
  configFile: string | null;
  /** Human-readable status message describing what happened. */
  message: string;
  /** Shell command for the user to add manually when the write to config failed. */
  manualCommand: string | null;
}

export function detectShellType(shellPath: string | undefined): ShellType {
  if (!shellPath) {
    return "unknown";
  }

  const shellName = basename(shellPath).toLowerCase();

  switch (shellName) {
    case "bash":
      return "bash";
    case "zsh":
      return "zsh";
    case "fish":
      return "fish";
    case "sh":
      return "sh";
    case "ash":
      return "ash";
    default:
      return "unknown";
  }
}

export function getConfigCandidates(
  shellType: ShellType,
  homeDir: string,
  xdgConfigHome?: string,
): string[] {
  const xdg = xdgConfigHome ?? join(homeDir, ".config");

  switch (shellType) {
    case "fish":
      return [join(xdg, "fish", "config.fish")];

    case "zsh":
      return [
        join(homeDir, ".zshrc"),
        join(homeDir, ".zshenv"),
        join(xdg, "zsh", ".zshrc"),
        join(xdg, "zsh", ".zshenv"),
      ];

    case "bash":
      return [
        join(homeDir, ".bashrc"),
        join(homeDir, ".bash_profile"),
        join(homeDir, ".profile"),
        join(xdg, "bash", ".bashrc"),
        join(xdg, "bash", ".bash_profile"),
      ];

    case "sh":
    case "ash":
      return [join(homeDir, ".profile")];

    default:
      return [
        join(homeDir, ".bashrc"),
        join(homeDir, ".bash_profile"),
        join(homeDir, ".profile"),
      ];
  }
}

export function findFirstExisting(candidates: string[]): string | null {
  for (const file of candidates) {
    if (existsSync(file)) {
      return file;
    }
  }
  return null;
}

export function detectShell(
  shellPath: string | undefined,
  homeDir: string,
  xdgConfigHome?: string,
): ShellInfo {
  const type = detectShellType(shellPath);
  const name = shellPath ? basename(shellPath) : type;
  const configCandidates = getConfigCandidates(type, homeDir, xdgConfigHome);
  const configFile = findFirstExisting(configCandidates);

  return { type, name, configFile, configCandidates };
}

export function buildPathExport(
  shellType: ShellType,
  directory: string,
): string {
  if (shellType === "fish") {
    return `fish_add_path "${directory}"`;
  }
  return `export PATH="${directory}:$PATH"`;
}

export function isInPath(
  directory: string,
  pathEnv: string | undefined,
): boolean {
  if (!pathEnv) {
    return false;
  }
  return pathEnv.split(delimiter).includes(directory);
}

/**
 * Write an observe-marked entry (`# observe\n<command>`) to a shell config file.
 * Creates the file if missing, skips if already present, returns a fallback
 * command when the write fails.
 */
async function writeShellConfigEntry({
  configFile,
  directory,
  command,
  label,
}: {
  configFile: string;
  directory: string;
  command: string;
  label: string;
}): Promise<PathModificationResult> {
  if (!existsSync(configFile)) {
    try {
      const dir = dirname(configFile);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(configFile, `# observe\n${command}\n`);
      return {
        modified: true,
        configFile,
        message: `Added "${directory}" to $${label} in "${configFile}"`,
        manualCommand: null,
      };
    } catch {
      return {
        modified: false,
        configFile: null,
        message: `Could not create ${configFile}`,
        manualCommand: command,
      };
    }
  }

  const content = readFileSync(configFile, "utf-8");

  if (content.includes(command) || content.includes(`"${directory}"`)) {
    return {
      modified: false,
      configFile,
      message: `"${directory}" already in $${label}`,
      manualCommand: null,
    };
  }

  try {
    const newContent = content.endsWith("\n")
      ? `${content}\n# observe\n${command}\n`
      : `${content}\n\n# observe\n${command}\n`;

    writeFileSync(configFile, newContent);
    return {
      modified: true,
      configFile,
      message: `Added "${directory}" to $${label} in "${configFile}"`,
      manualCommand: null,
    };
  } catch {
    return {
      modified: false,
      configFile: null,
      message: `Could not write to ${configFile}`,
      manualCommand: command,
    };
  }
}

export function addToPath(
  configFile: string,
  directory: string,
  shellType: ShellType,
): Promise<PathModificationResult> {
  return writeShellConfigEntry({
    configFile,
    directory,
    command: buildPathExport(shellType, directory),
    label: "PATH",
  });
}

/**
 * Removes all `# observe` marker lines and their following command lines
 * from a shell config file. Returns the number of blocks removed.
 */
export function removeObserveBlocks(configFile: string): number {
  if (!existsSync(configFile)) {
    return 0;
  }

  const content = readFileSync(configFile, "utf-8");
  const lines = content.split("\n");
  const filtered: string[] = [];
  let removed = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line?.trim() === "# observe") {
      removed++;
      if (i + 1 < lines.length) {
        i++;
      }
      const last = filtered[filtered.length - 1];
      if (filtered.length > 0 && last === "") {
        filtered.pop();
      }
    } else if (line !== undefined) {
      filtered.push(line);
    }
  }

  if (removed > 0) {
    writeFileSync(configFile, filtered.join("\n"));
  }

  return removed;
}

export async function addToGitHubPath(
  directory: string,
  env: Record<string, string | undefined>,
): Promise<boolean> {
  if (env.GITHUB_ACTIONS !== "true" || !env.GITHUB_PATH) {
    return false;
  }

  try {
    const filePath = env.GITHUB_PATH;
    const content = existsSync(filePath) ? readFileSync(filePath, "utf-8") : "";

    if (!content.includes(directory)) {
      const newContent = content.endsWith("\n")
        ? `${content}${directory}\n`
        : `${content}\n${directory}\n`;
      writeFileSync(filePath, newContent);
    }
    return true;
  } catch {
    return false;
  }
}
