import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { LocalContext } from "../../context";
import { createWriter } from "../../lib/writer";
import { status } from "./status";
import { host } from "./host";

const config = { customerId: "c", domain: "observeinc.com", token: "t" };

const loadConfig = (() => config) as never;

function makeResult() {
  return [
    {
      stageId: "query",
      resultKind: "ResultKindData",
      paginatedResults: {
        columns: [
          ["2026-06-24T12:00:00Z"],
          ["host-a"],
          ["prod"],
          ["1.2.3"],
          ["true"],
          ["inst-1"],
        ],
      },
      resultSchema: {
        fieldList: [
          { name: "valid_from", type: { tag: "Timestamp" } },
          { name: "host", type: { tag: "String" } },
          { name: "env", type: { tag: "String" } },
          { name: "version", type: { tag: "String" } },
          { name: "auth_ok", type: { tag: "Bool" } },
          { name: "instance_id", type: { tag: "String" } },
        ],
      },
      errors: null,
    },
  ];
}

const datasetQueryOutput = (() => Promise.resolve(makeResult() as never)) as never;

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

beforeAll(() => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";
});

afterAll(() => {
  if (previousNoColor === undefined) delete process.env.NO_COLOR;
  else process.env.NO_COLOR = previousNoColor;
  if (previousForceColor === undefined) delete process.env.FORCE_COLOR;
  else process.env.FORCE_COLOR = previousForceColor;
});

function createMockContext() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  let exitCode: number | undefined;

  const processMock = {
    stdout: {
      write: (msg: string) => {
        stdout.push(msg);
        return true;
      },
    },
    stderr: {
      write: (msg: string) => {
        stderr.push(msg);
        return true;
      },
    },
    exit: (code?: number) => {
      exitCode = code ?? 0;
      throw new Error("process.exit");
    },
  };

  const context = {
    process: processMock,
    writer: createWriter({ process: processMock }),
  } as unknown as LocalContext;

  return { context, stdout, stderr, getExitCode: () => exitCode };
}

describe("fleet status", () => {
  test("emits JSON rows in OPAL column order with --format json", async () => {
    const { context, stdout } = createMockContext();
    await status.call(
      context,
      { window: "20m", format: "json" },
      { loadConfig, datasetQueryOutput },
    );

    const output = JSON.parse(stdout.join(""));
    expect(output).toEqual([
      {
        valid_from: "2026-06-24T12:00:00Z",
        host: "host-a",
        env: "prod",
        version: "1.2.3",
        auth_ok: "true",
        instance_id: "inst-1",
      },
    ]);
  });

  test("emits CSV with header row in column order", async () => {
    const { context, stdout } = createMockContext();
    await status.call(
      context,
      { window: "20m", format: "csv" },
      { loadConfig, datasetQueryOutput },
    );

    const out = stdout.join("");
    expect(out.split("\n")[0]).toBe(
      "valid_from,host,env,version,auth_ok,instance_id",
    );
    expect(out).toContain("host-a");
  });

  test("renders a table by default", async () => {
    const { context, stdout } = createMockContext();
    await status.call(
      context,
      { window: "20m" },
      { loadConfig, datasetQueryOutput },
    );

    const out = stdout.join("");
    expect(out).toContain("host");
    expect(out).toContain("host-a");
    expect(out).toContain("1 row(s)");
  });

  test("exits 1 when the query path throws", async () => {
    const failing = (() => Promise.reject(new Error("query boom"))) as never;
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await status.call(
        context,
        { window: "20m" },
        { loadConfig, datasetQueryOutput: failing },
      );
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("fleet status failed");
  });
});

describe("fleet host", () => {
  test("passes the hostname through and outputs rows", async () => {
    const { context, stdout } = createMockContext();
    await host.call(
      context,
      { window: "24h", format: "json" },
      "host-a",
      { loadConfig, datasetQueryOutput },
    );

    const output = JSON.parse(stdout.join(""));
    expect(output[0].host).toBe("host-a");
  });
});
