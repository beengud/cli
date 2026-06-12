import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  determineInstallDir,
  installBinary,
  parseSha256Digest,
  sha256HexOfFile,
  verifyFileDigest,
} from "./binary";

function makeTempDir(): string {
  const dir = join(
    "/tmp",
    `observe-binary-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("determineInstallDir", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeTempDir();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("uses OBSERVE_INSTALL_DIR when set", () => {
    const customDir = join(testDir, "custom");
    const result = determineInstallDir({
      env: { OBSERVE_INSTALL_DIR: customDir },
      homeDir: testDir,
    });
    expect(result).toBe(customDir);
  });

  test("uses ~/.local/bin when it exists and is on PATH", () => {
    const localBin = join(testDir, ".local", "bin");
    mkdirSync(localBin, { recursive: true });

    const result = determineInstallDir({
      env: { PATH: `/usr/bin:${localBin}:/usr/local/bin` },
      homeDir: testDir,
    });
    expect(result).toBe(localBin);
  });

  test("falls back to ~/.observe/bin when ~/.local/bin not on PATH", () => {
    const localBin = join(testDir, ".local", "bin");
    mkdirSync(localBin, { recursive: true });

    const result = determineInstallDir({
      env: { PATH: "/usr/bin:/usr/local/bin" },
      homeDir: testDir,
    });
    expect(result).toBe(join(testDir, ".observe", "bin"));
  });

  test("falls back to ~/.observe/bin when ~/.local/bin doesn't exist", () => {
    const result = determineInstallDir({
      env: { PATH: "/usr/bin" },
      homeDir: testDir,
    });
    expect(result).toBe(join(testDir, ".observe", "bin"));
  });

  test("falls back to ~/.observe/bin when PATH is undefined", () => {
    const result = determineInstallDir({
      env: {},
      homeDir: testDir,
    });
    expect(result).toBe(join(testDir, ".observe", "bin"));
  });

  test("OBSERVE_INSTALL_DIR takes priority over ~/.local/bin", () => {
    const customDir = join(testDir, "custom");
    const localBin = join(testDir, ".local", "bin");
    mkdirSync(localBin, { recursive: true });

    const result = determineInstallDir({
      env: {
        OBSERVE_INSTALL_DIR: customDir,
        PATH: `/usr/bin:${localBin}`,
      },
      homeDir: testDir,
    });
    expect(result).toBe(customDir);
  });
});

describe("parseSha256Digest", () => {
  test("parses sha256: prefix and normalizes case", () => {
    const hex = "a".repeat(64);
    expect(parseSha256Digest(`sha256:${hex.toUpperCase()}`)).toBe(hex);
  });

  test("rejects invalid digest format", () => {
    expect(() => parseSha256Digest("md5:deadbeef")).toThrow(
      "Invalid release asset digest",
    );
  });
});

describe("verifyFileDigest", () => {
  let testDir: string;
  let filePath: string;

  beforeEach(() => {
    testDir = makeTempDir();
    filePath = join(testDir, "payload.bin");
    writeFileSync(filePath, "observe-cli-test-payload");
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("accepts matching digest", () => {
    const hex = sha256HexOfFile(filePath);
    verifyFileDigest({
      filePath,
      digest: `sha256:${hex}`,
      assetName: "observe-linux-x64.gz",
    });
  });

  test("rejects mismatched digest", () => {
    const hex = "0".repeat(64);
    expect(() =>
      verifyFileDigest({
        filePath,
        digest: `sha256:${hex}`,
        assetName: "observe-linux-x64.gz",
      }),
    ).toThrow("Binary integrity check failed");
  });
});

describe("installBinary", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = makeTempDir();
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("copies binary to install directory", () => {
    const source = join(testDir, "observe-tmp");
    writeFileSync(source, "#!/bin/sh\necho hello\n");

    const installDir = join(testDir, "install", "bin");
    const dest = installBinary({ sourcePath: source, installDir });

    expect(dest).toBe(join(installDir, "observe"));
    expect(existsSync(dest)).toBe(true);
    expect(readFileSync(dest, "utf-8")).toBe("#!/bin/sh\necho hello\n");
  });

  test("creates install directory if it doesn't exist", () => {
    const source = join(testDir, "observe-tmp");
    writeFileSync(source, "binary-content");

    const installDir = join(testDir, "deep", "nested", "bin");
    installBinary({ sourcePath: source, installDir });

    expect(existsSync(join(installDir, "observe"))).toBe(true);
  });

  test("overwrites existing binary", () => {
    const source = join(testDir, "observe-tmp");
    writeFileSync(source, "new-version");

    const installDir = join(testDir, "bin");
    mkdirSync(installDir, { recursive: true });
    writeFileSync(join(installDir, "observe"), "old-version");

    installBinary({ sourcePath: source, installDir });

    expect(readFileSync(join(installDir, "observe"), "utf-8")).toBe(
      "new-version",
    );
  });
});
