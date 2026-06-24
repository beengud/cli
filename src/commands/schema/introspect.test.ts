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
const gqlModulePath = resolve(repoRoot, "src/gql/schema/introspect-schema.ts");

const loadConfigFn = mock(() => ({
  customerId: "test-customer",
  token: "test-token",
  domain: "observeinc.com",
}));

const schemaPayload = {
  queryType: { name: "Query" },
  mutationType: { name: "Mutation" },
  subscriptionType: null,
  types: [
    {
      kind: "OBJECT",
      name: "Dashboard",
      description: "A dashboard",
      fields: [
        {
          name: "id",
          description: null,
          isDeprecated: false,
          type: { kind: "SCALAR", name: "String", ofType: null },
          args: [],
        },
      ],
      inputFields: null,
      enumValues: null,
      interfaces: [],
      possibleTypes: null,
    },
    {
      kind: "OBJECT",
      name: "Query",
      description: null,
      fields: [],
      inputFields: null,
      enumValues: null,
      interfaces: [],
      possibleTypes: null,
    },
  ],
};

const introspectSchemaFn = mock((_config: unknown) =>
  Promise.resolve(structuredClone(schemaPayload)),
);

let introspect: (typeof import("./introspect"))["introspect"];

let previousNoColor: string | undefined;
let previousForceColor: string | undefined;

const deps = {
  loadConfig: loadConfigFn,
} as Parameters<(typeof import("./introspect"))["introspect"]>[2];

beforeAll(async () => {
  previousNoColor = process.env.NO_COLOR;
  previousForceColor = process.env.FORCE_COLOR;
  process.env.NO_COLOR = "1";
  process.env.FORCE_COLOR = "0";

  void mock.module(gqlModulePath, () => ({
    introspectSchema: introspectSchemaFn,
  }));

  const mod = await import("./introspect.ts");
  introspect = mod.introspect;
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

  return { context, stdout, stderr, getExitCode: () => exitCode };
}

describe("schema introspect", () => {
  beforeEach(() => {
    loadConfigFn.mockClear();
    introspectSchemaFn.mockClear();
  });

  test("prints the full schema as JSON", async () => {
    const { context, stdout } = createMockContext();
    await introspect.call(context, {}, deps);

    expect(introspectSchemaFn).toHaveBeenCalledTimes(1);
    const output = JSON.parse(stdout.join(""));
    expect(output.queryType.name).toBe("Query");
    expect(output.types).toHaveLength(2);
    expect(output.types[0].name).toBe("Dashboard");
  });

  test("filters output to a single named type with --type", async () => {
    const { context, stdout } = createMockContext();
    await introspect.call(context, { type: "Dashboard" }, deps);

    const output = JSON.parse(stdout.join(""));
    // The filtered output is the single type object, not the full schema.
    expect(output.name).toBe("Dashboard");
    expect(output.kind).toBe("OBJECT");
    expect(output.queryType).toBeUndefined();
  });

  test("exits with code 1 when --type is not found", async () => {
    const { context, stderr, getExitCode } = createMockContext();
    try {
      await introspect.call(context, { type: "NonExistentType" }, deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("not found");
  });

  test("surfaces a clear message when introspection is disabled", async () => {
    introspectSchemaFn.mockImplementationOnce(() => {
      const err = new Error(
        "introspection is not enabled on this tenant",
      ) as Error & { statusCode: number };
      err.name = "GqlApiError";
      err.statusCode = 200;
      // Make it an instance of GqlApiError so the command's instanceof check
      // matches. Importing the real class keeps the prototype chain intact.
      return Promise.reject(makeGqlApiError(err.message));
    });

    const { context, stderr, getExitCode } = createMockContext();
    try {
      await introspect.call(context, {}, deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("introspection is disabled");
  });

  test("exits with code 1 on a generic API error", async () => {
    introspectSchemaFn.mockImplementationOnce(() =>
      Promise.reject(makeGqlApiError("Server error", 500)),
    );

    const { context, stderr, getExitCode } = createMockContext();
    try {
      await introspect.call(context, {}, deps);
      throw new Error("expected process.exit");
    } catch (error) {
      expect((error as Error).message).toBe("process.exit");
    }
    expect(getExitCode()).toBe(1);
    expect(stderr.join("")).toContain("API Error (500)");
  });
});

/**
 * Build an object that satisfies the command's `instanceof GqlApiError` check
 * without importing the gql-request module (which would pull in unrelated
 * code). We construct the real class lazily via the module the command uses.
 */
function makeGqlApiError(message: string, statusCode = 200) {
  const { GqlApiError } =
    require("../../gql/gql-request") as typeof import("../../gql/gql-request");
  return new GqlApiError(message, statusCode);
}
