/**
 * Binary installation utilities.
 *
 * Handles determining where to install the observe binary,
 * downloading releases from GitHub, and moving binaries into place.
 */

import {
  copyFileSync,
  createReadStream,
  createWriteStream,
  readFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  rmSync,
  unlinkSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { delimiter, join } from "node:path";
import { ensureConfigDir, getConfigDir } from "./config";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import type { Readable } from "node:stream";
import { CONFIG_DIR_NAME, CONFIG_FILES } from "./constants";
import { fetchReleaseByTag, type ReleaseAsset } from "./github-release";

const BINARY_NAME = "observe";

export function determineInstallDir({
  env,
  homeDir,
}: {
  env: Record<string, string | undefined>;
  homeDir: string;
}) {
  if (env.OBSERVE_INSTALL_DIR) {
    return env.OBSERVE_INSTALL_DIR;
  }

  const localBin = join(homeDir, ".local", "bin");
  if (existsSync(localBin) && isOnPath(localBin, env.PATH)) {
    return localBin;
  }

  return join(homeDir, CONFIG_DIR_NAME, CONFIG_FILES.bin.name);
}

function isOnPath(dir: string, pathEnv: string | undefined) {
  if (!pathEnv) return false;
  return pathEnv.split(delimiter).includes(dir);
}

export function installBinary({
  sourcePath,
  installDir,
}: {
  sourcePath: string;
  installDir: string;
}) {
  const configDir = getConfigDir();
  const isUnderConfigDir =
    installDir === configDir || installDir.startsWith(configDir + "/");

  if (isUnderConfigDir) {
    ensureConfigDir();
  }

  if (!existsSync(installDir)) {
    mkdirSync(installDir, {
      recursive: true,
      ...(isUnderConfigDir && { mode: CONFIG_FILES.bin.mode }),
    });
  }

  const dest = join(installDir, BINARY_NAME);

  if (existsSync(dest)) {
    unlinkSync(dest);
  }

  copyFileSync(sourcePath, dest);
  chmodSync(dest, 0o755);

  return dest;
}

export function detectPlatform() {
  const platform = process.platform === "win32" ? "windows" : process.platform;
  const arch = process.arch === "arm64" ? "arm64" : "x64";
  return { platform, arch };
}

export function parseSha256Digest(digest: string) {
  const match = /^sha256:([a-f0-9]{64})$/i.exec(digest.trim());
  if (!match) {
    throw new Error(`Invalid release asset digest: ${digest}`);
  }
  // match[1] is guaranteed by the regex having a capture group
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return match[1]!.toLowerCase();
}

export function sha256HexOfFile(filePath: string) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

export function verifyFileDigest({
  filePath,
  digest,
  assetName,
}: {
  filePath: string;
  digest: string;
  assetName: string;
}) {
  const expected = parseSha256Digest(digest);
  const actual = sha256HexOfFile(filePath);
  if (actual !== expected) {
    throw new Error(
      `Binary integrity check failed for ${assetName}: digest mismatch`,
    );
  }
}

async function downloadToFile({
  url,
  destPath,
  signal,
}: {
  url: string;
  destPath: string;
  signal?: AbortSignal;
}) {
  const response = await fetch(url, { signal });
  if (!response.ok || !response.body) {
    throw new Error(
      `Failed to download binary from ${url}: HTTP ${String(response.status)}`,
    );
  }

  const fileStream = createWriteStream(destPath);
  await pipeline(response.body as unknown as Readable, fileStream);
}

async function gunzipFile({
  sourcePath,
  destPath,
}: {
  sourcePath: string;
  destPath: string;
}) {
  const gunzip = createGunzip();
  const input = createReadStream(sourcePath);
  const output = createWriteStream(destPath);
  await pipeline(input, gunzip, output);
}

async function downloadAndVerifyAsset({
  asset,
  destPath,
  signal,
}: {
  asset: ReleaseAsset;
  destPath: string;
  signal?: AbortSignal;
}) {
  if (!asset.digest) {
    throw new Error(
      `Release asset ${asset.name} is missing a digest; refusing to install`,
    );
  }

  await downloadToFile({
    url: asset.browser_download_url,
    destPath,
    signal,
  });
  verifyFileDigest({
    filePath: destPath,
    digest: asset.digest,
    assetName: asset.name,
  });
}

export async function downloadReleaseBinary({
  tag,
  platform,
  arch,
  destPath,
  signal,
}: {
  tag: string;
  platform: string;
  arch: string;
  destPath: string;
  signal?: AbortSignal;
}) {
  const baseName = `observe-${platform}-${arch}`;
  const release = await fetchReleaseByTag({ tag, signal });
  const gzAsset = release.assets.find(
    (asset) => asset.name === `${baseName}.gz`,
  );
  const rawAsset = release.assets.find((asset) => asset.name === baseName);

  if (gzAsset) {
    const gzPath = `${destPath}.gz`;
    try {
      await downloadAndVerifyAsset({
        asset: gzAsset,
        destPath: gzPath,
        signal,
      });
      await gunzipFile({ sourcePath: gzPath, destPath });
      return;
    } catch (err) {
      if (!rawAsset) throw err;
    } finally {
      rmSync(gzPath, { force: true });
    }
  }

  if (rawAsset) {
    await downloadAndVerifyAsset({ asset: rawAsset, destPath, signal });
    return;
  }

  throw new Error(
    `No release asset found for ${baseName} or ${baseName}.gz in ${tag}`,
  );
}
