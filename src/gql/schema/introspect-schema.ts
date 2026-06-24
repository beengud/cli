import { getApiBaseUrl, type Config } from "../../lib/config";
import { observeApiHeaders } from "../../lib/user-agent";
import { GqlApiError } from "../gql-request";

/**
 * Raw GraphQL introspection query, mirroring the query used by the legacy Go
 * CLI (`cmd_schema.go`). This intentionally does NOT depend on the codegen'd
 * types under `../generated/graphql` because it queries the server's
 * `__schema` meta type directly rather than a domain operation.
 *
 * Keep this in sync with `introspect-schema.graphql`.
 */
const INTROSPECTION_QUERY = `query Schema_Introspect {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      kind
      name
      description
      fields(includeDeprecated: true) {
        name
        description
        isDeprecated
        type {
          kind
          name
          ofType { kind name ofType { kind name } }
        }
        args {
          name
          description
          type { kind name ofType { kind name } }
        }
      }
      inputFields {
        name
        description
        type {
          kind
          name
          ofType { kind name ofType { kind name } }
        }
      }
      enumValues(includeDeprecated: true) {
        name
        description
        isDeprecated
      }
      interfaces { name kind }
      possibleTypes { name kind }
    }
  }
}`;

/** A single named type entry from `__schema.types`. */
export interface IntrospectionType {
  kind: string;
  name: string | null;
  description: string | null;
  fields: unknown[] | null;
  inputFields: unknown[] | null;
  enumValues: unknown[] | null;
  interfaces: unknown[] | null;
  possibleTypes: unknown[] | null;
}

/** The `__schema` payload returned by the introspection query. */
export interface IntrospectionSchema {
  queryType: { name: string | null } | null;
  mutationType: { name: string | null } | null;
  subscriptionType: { name: string | null } | null;
  types: IntrospectionType[];
}

interface IntrospectionResponse {
  data?: { __schema?: IntrospectionSchema };
  errors?: { message: string }[];
}

/**
 * Run the GraphQL introspection query against the Observe `/v1/meta` endpoint
 * and return the `__schema` payload.
 *
 * Mirrors the auth/header approach of `executeGraphQL` in `gql-request.ts` but
 * issues the raw introspection query directly so it does not require any
 * generated `TypedDocumentNode`.
 */
export async function introspectSchema(
  config: Config,
): Promise<IntrospectionSchema> {
  const baseUrl = getApiBaseUrl(config);
  const url = `${baseUrl}/v1/meta`;

  const response = await fetch(url, {
    method: "POST",
    headers: observeApiHeaders({
      Authorization: `Bearer ${config.customerId} ${config.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    body: JSON.stringify({ query: INTROSPECTION_QUERY }),
  });

  if (!response.ok) {
    throw new GqlApiError(
      `GraphQL request failed: ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  const json = (await response.json()) as IntrospectionResponse;

  if (json.errors?.length) {
    throw new GqlApiError(
      json.errors.map((e) => e.message).join(", "),
      200,
      json.errors,
    );
  }

  const schema = json.data?.__schema;
  if (!schema) {
    throw new Error("schema introspect: no result returned");
  }

  return schema;
}
