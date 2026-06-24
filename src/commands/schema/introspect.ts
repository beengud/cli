import { buildCommand } from "@stricli/core";
import type { LocalContext } from "../../context";
import {
  introspectSchema,
  type IntrospectionType,
} from "../../gql/schema/introspect-schema";
import { GqlApiError } from "../../gql/gql-request";
import { loadConfig } from "../../lib/config";

interface IntrospectFlags {
  type?: string;
}

export interface IntrospectDeps {
  loadConfig?: typeof loadConfig;
  introspectSchema?: typeof introspectSchema;
}

/**
 * Detect the server's "introspection disabled" error so we can surface a clear
 * message. Tenants that disable introspection reject the query with an error
 * mentioning that introspection is not enabled.
 */
function isIntrospectionDisabled(error: GqlApiError): boolean {
  return /introspection/i.test(error.message);
}

export async function introspect(
  this: LocalContext,
  flags: IntrospectFlags,
  deps: IntrospectDeps = {},
): Promise<void> {
  const {
    loadConfig: loadConfigImpl = loadConfig,
    introspectSchema: introspectSchemaImpl = introspectSchema,
  } = deps;
  const { process, writer } = this;

  try {
    const config = loadConfigImpl();
    const schema = await introspectSchemaImpl(config);

    if (flags.type) {
      const match = schema.types.find(
        (t: IntrospectionType) => t.name === flags.type,
      );
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
      if (isIntrospectionDisabled(error)) {
        writer.error(
          "Error: GraphQL introspection is disabled on this tenant. " +
            "This command requires a tenant with introspection enabled.",
        );
      } else {
        writer.error(`API Error (${error.statusCode}): ${error.message}`);
      }
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
    positional: {
      kind: "tuple",
      parameters: [],
    },
    flags: {
      type: {
        kind: "parsed",
        parse: String,
        brief: "Filter output to a specific type name (e.g. Dashboard, Query)",
        optional: true,
      },
    },
  },
  docs: {
    brief: "Run a GraphQL introspection query and print the schema as JSON",
  },
});
