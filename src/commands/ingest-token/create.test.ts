import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";
import { resolve } from "node:path";
import type { LocalContext } from "../../context";
import { createWriter } from "../../lib/writer";

const repoRoot = resolve(import.meta.dir, "../../..");
const createTokenModulePath = resolve(
  repoRoot,
  "src/gql/ingest-token/create-ingest-token.ts",
);
const associationModulePath = resolve(
  repoRoot,
  "src/gql/ingest-token/update-ingest-token-association.ts",
);

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const createIngestTokenFn = mock((_config: unknown, _variables: unknown) =>
  Promise.resolve({
    id: "token-789",
    name: "k8s-ingest",
    description: null,
    disabled: false,
    secret: "secret-abc-xyz",
  }),
);

const updateAssociationFn = mock((_config: unknown, _variables: unknown) =>
  Promise.resolve(true),
);

let create: (typeof import("./create"))["create"];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

const deps = {
  loadConfig: loadConfigFn,
} as Parameters<(typeof import("./create"))["create"]>[1];

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  void mock.module(createTokenModulePath, () => ({
    createIngestToken: createIngestTokenFn,
  }));

  void mock.module(associationModulePath, () => ({
    updateIngestTokenAssociation: updateAssociationFn,
  }));

  const mod = await import("./create.ts");
  create = mod.create;
});

afterAll(() => {
  mock.restore();
  if (previousNoColor === undefined) {
    delete process.env.NO_COLOR;
  } else {
    process.env.NO_COLOR = previousNoColor;
  }
  if (previousForceColor === undefined) {
    delete process.env.FORCE_COLOR;
  } else {
    process.env.FORCE_COLOR = previousForceColor;
  }
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

  return {
    context,
    stdout,
    stderr,
    getExitCode: () => exitCode,
  };
}

describe("ingest-token create", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    createIngestTokenFn.mockClear();
    updateAssociationFn.mockClear();
  });

  test("creates token and associates with datastreams", async () => {
    const { context, stdout } = createMockContext();
    await create.call(
      context,
      {
        name: "k8s-ingest",
        datastreamIds: "ds-1,ds-2,ds-3",
      },
      deps,
    );

    expect(createIngestTokenFn).toHaveBeenCalledTimes(1);
    const [, createVars] = createIngestTokenFn.mock.calls[0]!;
    expect(createVars).toMatchObject({
      input: { name: "k8s-ingest" },
    });

    expect(updateAssociationFn).toHaveBeenCalledTimes(1);
    const [, assocVars] = updateAssociationFn.mock.calls[0]!;
    expect(assocVars).toMatchObject({
      id: "token-789",
      datastreamIDs: ["ds-1", "ds-2", "ds-3"],
    });

    const output = JSON.parse(stdout.join(""));
    expect(output.id).toBe("token-789");
    expect(output.secret).toBe("secret-abc-xyz");
  });

  test("trims whitespace in datastream IDs", async () => {
    const { context } = createMockContext();
    await create.call(
      context,
      {
        name: "test",
        datastreamIds: " ds-1 , ds-2 ",
      },
      deps,
    );

    const [, assocVars] = updateAssociationFn.mock.calls[0]!;
    expect(assocVars).toMatchObject({
      datastreamIDs: ["ds-1", "ds-2"],
    });
  });

  test("outputs token secret for agent consumption", async () => {
    const { context, stdout } = createMockContext();
    await create.call(
      context,
      {
        name: "test",
        datastreamIds: "ds-1",
      },
      deps,
    );

    const output = JSON.parse(stdout.join(""));
    expect(output.secret).toBeDefined();
  });
});
