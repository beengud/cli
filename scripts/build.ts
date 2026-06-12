import { rmSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { parseArgs, promisify } from "node:util";
import { gzip } from "node:zlib";
import * as Bun from "bun";
import pkg from "../package.json";
import { BUILD_ENV, TELEMETRY_BUILD_VARS } from "../src/lib/constants";
import { checkReleaseEnv } from "./check-release-env";

const gzipAsync = promisify(gzip);

const ENTRYPOINT = "./src/bin.ts";
const BIN_OUT_DIR = "dist-bin";
const JS_OUT_DIR = "dist";
const JS_BUNDLE_NAME = "cli.js";
const JS_BUNDLE = `${JS_OUT_DIR}/${JS_BUNDLE_NAME}`;

const { values: flags } = parseArgs({
  args: process.argv.slice(2),
  options: {
    single: { type: "boolean", default: false },
    target: { type: "string" },
  },
});

interface Target {
  name: string;
  bunTarget: Bun.Build.CompileTarget;
  outfile: string;
}

function outfile(name: string) {
  const ext = name.startsWith("windows-") ? ".exe" : "";
  return `${BIN_OUT_DIR}/observe-${name}${ext}`;
}

const allTargets: Target[] = [
  {
    name: "darwin-arm64",
    bunTarget: "bun-darwin-arm64",
    outfile: outfile("darwin-arm64"),
  },
  {
    name: "darwin-x64",
    bunTarget: "bun-darwin-x64",
    outfile: outfile("darwin-x64"),
  },
  {
    name: "linux-x64",
    bunTarget: "bun-linux-x64",
    outfile: outfile("linux-x64"),
  },
  {
    name: "linux-arm64",
    bunTarget: "bun-linux-arm64",
    outfile: outfile("linux-arm64"),
  },
  {
    name: "windows-x64",
    bunTarget: "bun-windows-x64",
    outfile: outfile("windows-x64"),
  },
  {
    name: "windows-arm64",
    bunTarget: "bun-windows-arm64",
    outfile: outfile("windows-arm64"),
  },
];

function getCurrentTargetName() {
  const platform = process.platform === "win32" ? "windows" : process.platform;
  const arch = process.arch === "arm64" ? "arm64" : "x64";
  return `${platform}-${arch}`;
}

function selectTargets() {
  if (flags.target) {
    const match = allTargets.find((t) => t.name === flags.target);
    if (!match) {
      const valid = allTargets.map((t) => t.name).join(", ");
      throw new Error(
        `Unknown target "${flags.target}". Valid targets: ${valid}`,
      );
    }
    return [match];
  }

  if (flags.single) {
    const current = getCurrentTargetName();
    const match = allTargets.find((t) => t.name === current);
    if (!match) {
      throw new Error(`No target defined for current platform: ${current}`);
    }
    return [match];
  }

  return allTargets;
}

checkReleaseEnv();

const version = process.env[BUILD_ENV.VERSION] ?? pkg.version;
const isReleaseBuild = process.env[BUILD_ENV.RELEASE_BUILD] === "1";

const define: Record<string, string> = {
  OBSERVE_CLI_VERSION: JSON.stringify(version),
};

for (const name of TELEMETRY_BUILD_VARS) {
  const value = process.env[name];
  if (value) define[name] = JSON.stringify(value);
}

async function bundleJs() {
  console.log("Bundling JS...");

  rmSync(JS_OUT_DIR, { recursive: true, force: true });
  mkdirSync(JS_OUT_DIR, { recursive: true });

  const result = await Bun.build({
    entrypoints: [ENTRYPOINT],
    outdir: JS_OUT_DIR,
    naming: JS_BUNDLE_NAME,
    target: "node",
    define,
    minify: true,
  });

  if (!result.success) {
    console.error("  ✗ JS bundle failed:");
    for (const log of result.logs) {
      if (log.level === "error") {
        console.error(`    ${log.message}`);
      } else {
        console.warn(`    ${log.message}`);
      }
    }
    return false;
  }

  const file = Bun.file(JS_BUNDLE);
  const size = (file.size / 1024).toFixed(0);
  console.log(`  ✓ ${JS_BUNDLE} (${size} KB)\n`);

  if (isReleaseBuild) {
    const bundleText = await file.text();
    const missing = TELEMETRY_BUILD_VARS.filter((name) => {
      const value = process.env[name];
      return value && !bundleText.includes(value);
    });
    if (missing.length > 0) {
      console.error(
        `  ✗ Release bundle is missing inlined telemetry values: ${missing.join(
          ", ",
        )}`,
      );
      return false;
    }
  }

  return true;
}

async function compileBinary(target: Target) {
  console.log(`  ${target.name} → ${target.outfile}`);

  const result = await Bun.build({
    entrypoints: [ENTRYPOINT],
    compile: {
      target: target.bunTarget,
      outfile: target.outfile,
    },
    define,
    minify: true,
  });

  if (!result.success) {
    console.error(`  ✗ ${target.name} failed:`);
    for (const log of result.logs) {
      if (log.level === "error") {
        console.error(`    ${log.message}`);
      } else if (log.level === "warning") {
        console.warn(`    ${log.message}`);
      } else {
        console.log(`    ${log.message}`);
      }
    }
    return false;
  }

  let signed = false;
  if (process.platform === "darwin" && target.name.startsWith("darwin-")) {
    try {
      execSync(`codesign --remove-signature "${target.outfile}"`, {
        stdio: "pipe",
      });
      execSync(`codesign -s - "${target.outfile}"`, { stdio: "pipe" });
      signed = true;
    } catch (e: unknown) {
      const stderr =
        e instanceof Error && "stderr" in e
          ? String((e as { stderr: unknown }).stderr)
          : String(e);
      console.warn(`  ⚠ ${target.name} codesign failed: ${stderr.trim()}`);
    }
  }

  if (isReleaseBuild) {
    const binary = await Bun.file(target.outfile).arrayBuffer();
    const compressed = await gzipAsync(Buffer.from(binary), { level: 6 });
    await Bun.write(`${target.outfile}.gz`, compressed);
    const ratio = (
      (1 - compressed.byteLength / binary.byteLength) *
      100
    ).toFixed(0);
    console.log(`  ✓ ${target.name} (+.gz, ${ratio}% smaller)`);
  } else {
    console.log(`  ✓ ${target.name}${signed ? " (signed)" : ""}`);
  }

  return true;
}

async function compileBinaries() {
  const targets = selectTargets();

  rmSync(BIN_OUT_DIR, { recursive: true, force: true });
  mkdirSync(BIN_OUT_DIR, { recursive: true });

  console.log(`Compiling binaries for ${String(targets.length)} target(s):\n`);

  let failed = 0;
  for (const target of targets) {
    const ok = await compileBinary(target);
    if (!ok) failed += 1;
  }

  if (failed > 0) {
    console.error(`\n${String(failed)} build(s) failed`);
    return false;
  }

  return true;
}

const jsBundled = await bundleJs();
if (!jsBundled) process.exit(1);

const binariesCompiled = await compileBinaries();
if (!binariesCompiled) process.exit(1);

console.log("\nAll builds succeeded");
