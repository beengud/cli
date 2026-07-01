import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import { introspectSchema } from "../../gql/schema/introspect";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

interface IntrospectFlags {
  type?: string;
}

async function introspect(
  this: LocalContext,
  flags: IntrospectFlags,
): Promise<void> {
  const { process, writer } = this;

  try {
    const config = loadConfig();
    const schema = await introspectSchema(config);

    if (flags.type) {
      const match = schema.types.find((t) => t.name === flags.type);
      if (!match) {
        writer.error(
          `Error: schema introspect: type "${flags.type}" not found`,
        );
        process.exit(1);
        return;
      }
      writer.write(JSON.stringify(match, null, 2));
      return;
    }

    writer.write(JSON.stringify(schema, null, 2));
  } catch (error) {
    if (error instanceof GqlApiError) {
      writer.error(`API Error (${error.statusCode}): ${error.message}`);
    } else {
      const message = error instanceof Error ? error.message : String(error);
      writer.error(`Error: ${message}`);
    }
    process.exit(1);
  }
}

export const introspectCommand = buildCommand({
  loader: async () => introspect,
  parameters: {
    positional: { kind: "tuple", parameters: [] },
    flags: {
      type: {
        kind: "parsed",
        parse: String,
        brief: "Filter output to a single type by name",
        optional: true,
      },
    },
  },
  docs: {
    brief:
      "Introspect the Observe GraphQL schema (requires introspection enabled)",
  },
});
