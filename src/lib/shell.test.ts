import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  detectShellType,
  detectShell,
  getConfigCandidates,
  findFirstExisting,
  buildPathExport,
  isInPath,
  addToPath,
  addToGitHubPath,
  removeObserveBlocks,
  type ShellType,
} from "./shell";

function makeTempDir(): string {
  const dir = join(
    "/tmp",
    `observe-shell-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("detectShellType", () => {
  test("detects bash from path", () => {
    expect(detectShellType("/bin/bash")).toBe("bash");
  });

  test("detects zsh from path", () => {
    expect(detectShellType("/bin/zsh")).toBe("zsh");
  });

  test("detects fish from path", () => {
    expect(detectShellType("/usr/bin/fish")).toBe("fish");
  });

  test("detects sh from path", () => {
    expect(detectShellType("/bin/sh")).toBe("sh");
  });

  test("detects ash from path", () => {
    expect(detectShellType("/bin/ash")).toBe("ash");
  });

  test("returns unknown for unrecognized shell", () => {
    expect(detectShellType("/usr/bin/xonsh")).toBe("unknown");
  });

  test("returns unknown for undefined", () => {
    expect(detectShellType(undefined)).toBe("unknown");
  });

  test("handles paths with multiple segments", () => {
    expect(detectShellType("/nix/store/abc123-bash-5.2/bin/bash")).toBe("bash");
  });
});

describe("getConfigCandidates", () => {
  test("returns zsh candidates", () => {
    const candidates = getConfigCandidates("zsh", "/home/user");
    expect(candidates).toContain("/home/user/.zshrc");
    expect(candidates).toContain("/home/user/.zshenv");
  });

  test("returns bash candidates", () => {
    const candidates = getConfigCandidates("bash", "/home/user");
    expect(candidates).toContain("/home/user/.bashrc");
    expect(candidates).toContain("/home/user/.bash_profile");
    expect(candidates).toContain("/home/user/.profile");
  });

  test("returns fish candidates", () => {
    const candidates = getConfigCandidates("fish", "/home/user");
    expect(candidates.some((c) => c.includes("config.fish"))).toBe(true);
  });

  test("returns fallback candidates for unknown shell", () => {
    const candidates = getConfigCandidates("unknown", "/home/user");
    expect(candidates).toContain("/home/user/.bashrc");
    expect(candidates).toContain("/home/user/.profile");
  });

  test("returns .profile for ash", () => {
    const candidates = getConfigCandidates("ash", "/home/user");
    expect(candidates).toContain("/home/user/.profile");
  });

  test("all paths start with the home directory", () => {
    const types: ShellType[] = ["bash", "zsh", "fish", "sh", "ash", "unknown"];
    for (const type of types) {
      const candidates = getConfigCandidates(type, "/home/testuser");
      for (const path of candidates) {
        expect(path.startsWith("/home/testuser")).toBe(true);
      }
    }
  });

  test("respects custom XDG_CONFIG_HOME", () => {
    const candidates = getConfigCandidates(
      "fish",
      "/home/user",
      "/custom/config",
    );
    expect(candidates.some((c) => c.startsWith("/custom/config"))).toBe(true);
  });
});

describe("findFirstExisting", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeTempDir();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("returns first existing file", () => {
    const file2 = join(testDir, ".bash_profile");
    writeFileSync(file2, "# bash profile");

    const result = findFirstExisting([
      join(testDir, ".bashrc"),
      file2,
      join(testDir, ".profile"),
    ]);
    expect(result).toBe(file2);
  });

  test("returns null when no files exist", () => {
    const result = findFirstExisting([
      join(testDir, ".nonexistent1"),
      join(testDir, ".nonexistent2"),
    ]);
    expect(result).toBeNull();
  });
});

describe("detectShell", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeTempDir();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("detects shell type and finds config file", () => {
    const zshrc = join(testDir, ".zshrc");
    writeFileSync(zshrc, "# zshrc");

    const result = detectShell("/bin/zsh", testDir);
    expect(result.type).toBe("zsh");
    expect(result.name).toBe("zsh");
    expect(result.configFile).toBe(zshrc);
  });

  test("returns null configFile when none exist", () => {
    const result = detectShell("/bin/zsh", testDir);
    expect(result.type).toBe("zsh");
    expect(result.configFile).toBeNull();
  });

  test("includes config candidates", () => {
    const result = detectShell("/bin/bash", testDir);
    expect(result.configCandidates.length).toBeGreaterThan(0);
  });
});

describe("buildPathExport", () => {
  test("generates export PATH for bash", () => {
    expect(buildPathExport("bash", "/home/user/.observe/bin")).toBe(
      'export PATH="/home/user/.observe/bin:$PATH"',
    );
  });

  test("generates export PATH for zsh", () => {
    expect(buildPathExport("zsh", "/home/user/.observe/bin")).toBe(
      'export PATH="/home/user/.observe/bin:$PATH"',
    );
  });

  test("generates fish_add_path for fish", () => {
    expect(buildPathExport("fish", "/home/user/.observe/bin")).toBe(
      'fish_add_path "/home/user/.observe/bin"',
    );
  });

  test("always contains the directory", () => {
    const types: ShellType[] = ["bash", "zsh", "fish", "sh", "unknown"];
    for (const type of types) {
      const cmd = buildPathExport(type, "/some/path");
      expect(cmd).toContain("/some/path");
    }
  });
});

describe("isInPath", () => {
  test("finds directory in PATH", () => {
    expect(
      isInPath("/usr/local/bin", "/usr/bin:/usr/local/bin:/home/user/bin"),
    ).toBe(true);
  });

  test("returns false for missing directory", () => {
    expect(isInPath("/not/here", "/usr/bin:/usr/local/bin")).toBe(false);
  });

  test("returns false for undefined PATH", () => {
    expect(isInPath("/usr/bin", undefined)).toBe(false);
  });

  test("handles single-entry PATH", () => {
    expect(isInPath("/usr/bin", "/usr/bin")).toBe(true);
  });
});

describe("addToPath", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeTempDir();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("creates config file if it doesn't exist", async () => {
    const configFile = join(testDir, ".bashrc");
    const result = await addToPath(
      configFile,
      "/home/user/.observe/bin",
      "bash",
    );

    expect(result.modified).toBe(true);
    expect(result.configFile).toBe(configFile);

    const content = readFileSync(configFile, "utf-8");
    expect(content).toContain('export PATH="/home/user/.observe/bin:$PATH"');
    expect(content).toContain("# observe");
  });

  test("appends to existing config file", async () => {
    const configFile = join(testDir, ".bashrc");
    writeFileSync(configFile, "# existing content\n");

    const result = await addToPath(
      configFile,
      "/home/user/.observe/bin",
      "bash",
    );

    expect(result.modified).toBe(true);

    const content = readFileSync(configFile, "utf-8");
    expect(content).toContain("# existing content");
    expect(content).toContain("# observe");
    expect(content).toContain('export PATH="/home/user/.observe/bin:$PATH"');
  });

  test("is idempotent - second call returns modified=false", async () => {
    const configFile = join(testDir, ".bashrc");

    const first = await addToPath(
      configFile,
      "/home/user/.observe/bin",
      "bash",
    );
    expect(first.modified).toBe(true);

    const second = await addToPath(
      configFile,
      "/home/user/.observe/bin",
      "bash",
    );
    expect(second.modified).toBe(false);
    expect(second.message).toContain("already in $PATH");
  });

  test("appends newline separator when file doesn't end with newline", async () => {
    const configFile = join(testDir, ".bashrc");
    writeFileSync(configFile, "# no trailing newline");

    await addToPath(configFile, "/home/user/.observe/bin", "bash");

    const content = readFileSync(configFile, "utf-8");
    expect(content).toContain("# no trailing newline\n\n# observe\n");
  });

  test("returns manualCommand when config file cannot be created", async () => {
    const configFile = "/dev/null/impossible/path/.bashrc";
    const result = await addToPath(
      configFile,
      "/home/user/.observe/bin",
      "bash",
    );

    expect(result.modified).toBe(false);
    expect(result.manualCommand).toBe(
      'export PATH="/home/user/.observe/bin:$PATH"',
    );
  });
});

describe("addToGitHubPath", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeTempDir();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("returns false when not in GitHub Actions", async () => {
    const result = await addToGitHubPath("/usr/local/bin", {});
    expect(result).toBe(false);
  });

  test("returns false when GITHUB_PATH is not set", async () => {
    const result = await addToGitHubPath("/usr/local/bin", {
      GITHUB_ACTIONS: "true",
    });
    expect(result).toBe(false);
  });

  test("writes directory to GITHUB_PATH file", async () => {
    const pathFile = join(testDir, "github_path");
    writeFileSync(pathFile, "");

    const result = await addToGitHubPath("/usr/local/bin", {
      GITHUB_ACTIONS: "true",
      GITHUB_PATH: pathFile,
    });

    expect(result).toBe(true);
    const content = readFileSync(pathFile, "utf-8");
    expect(content).toContain("/usr/local/bin");
  });

  test("does not duplicate existing directory", async () => {
    const pathFile = join(testDir, "github_path");
    writeFileSync(pathFile, "/usr/local/bin\n");

    await addToGitHubPath("/usr/local/bin", {
      GITHUB_ACTIONS: "true",
      GITHUB_PATH: pathFile,
    });

    const content = readFileSync(pathFile, "utf-8");
    expect(content).toBe("/usr/local/bin\n");
  });
});

describe("removeObserveBlocks", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeTempDir();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("removes observe marker and command line", () => {
    const configFile = join(testDir, ".zshrc");
    writeFileSync(
      configFile,
      '# existing\n\n# observe\nexport PATH="/opt/bin:$PATH"\n# other\n',
    );

    const removed = removeObserveBlocks(configFile);
    expect(removed).toBe(1);

    const content = readFileSync(configFile, "utf-8");
    expect(content).not.toContain("# observe");
    expect(content).not.toContain("/opt/bin");
    expect(content).toContain("# other");
  });

  test("removes multiple observe blocks", () => {
    const configFile = join(testDir, ".zshrc");
    writeFileSync(
      configFile,
      '# observe\nexport PATH="/a:$PATH"\n\n# observe\nfpath=("/b" $fpath)\n',
    );

    const removed = removeObserveBlocks(configFile);
    expect(removed).toBe(2);

    const content = readFileSync(configFile, "utf-8");
    expect(content).not.toContain("# observe");
  });

  test("returns 0 for file without observe blocks", () => {
    const configFile = join(testDir, ".zshrc");
    writeFileSync(configFile, "# just some config\nexport FOO=bar\n");

    const removed = removeObserveBlocks(configFile);
    expect(removed).toBe(0);
  });

  test("returns 0 for nonexistent file", () => {
    const removed = removeObserveBlocks(join(testDir, ".nonexistent"));
    expect(removed).toBe(0);
  });
});
