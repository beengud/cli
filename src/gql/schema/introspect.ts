import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { parse } from "graphql";
import type { Config } from "../../lib/config";
import { executeGraphQL } from "../gql-request";

// Hand-authored introspection query; mirrors gqlSchemaIntrospect in the Go fork
// (cmd_schema.go). This is NOT a codegen operation (it queries the meta field
// __schema), so it is declared by hand. NOTE: it only succeeds when the tenant
// has GraphQL introspection enabled.
export interface SchemaType {
  kind: string | null;
  name: string | null;
  description: string | null;
  [key: string]: unknown;
}

export interface IntrospectionSchema {
  queryType: { name: string | null } | null;
  mutationType: { name: string | null } | null;
  subscriptionType: { name: string | null } | null;
  types: SchemaType[];
}

interface IntrospectResult {
  __schema: IntrospectionSchema;
}

const IntrospectDocument = parse(`
  query Schema_Introspect {
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
  }
`) as unknown as TypedDocumentNode<IntrospectResult, Record<string, never>>;

export async function introspectSchema(config: Config) {
  const response = await executeGraphQL(config, IntrospectDocument, {});
  return response.data.__schema;
}
