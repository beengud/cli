/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "query CheckQueries($queries: MultiStageQueryInput!) {\n  checkQueries(queries: $queries) {\n    parsedPipeline {\n      errors {\n        col\n        row\n        text\n      }\n      warnings {\n        kind\n        symbol {\n          col\n          row\n        }\n      }\n    }\n    resultSchema {\n      fieldList {\n        name\n      }\n    }\n  }\n}": typeof types.CheckQueriesDocument,
    "query ValidateIngestFilter($pipeline: String!, $sourceDatasetID: ObjectId!) {\n  validateIngestFilterExpression(\n    pipeline: $pipeline\n    sourceDatasetID: $sourceDatasetID\n  ) {\n    message\n  }\n}": typeof types.ValidateIngestFilterDocument,
    "query VerbsAndFunctions {\n  verbsAndFunctions {\n    verbs {\n      name\n      description\n      categories\n    }\n    functions {\n      name\n      description\n      categories\n      returnType\n    }\n  }\n}": typeof types.VerbsAndFunctionsDocument,
};
const documents: Documents = {
    "query CheckQueries($queries: MultiStageQueryInput!) {\n  checkQueries(queries: $queries) {\n    parsedPipeline {\n      errors {\n        col\n        row\n        text\n      }\n      warnings {\n        kind\n        symbol {\n          col\n          row\n        }\n      }\n    }\n    resultSchema {\n      fieldList {\n        name\n      }\n    }\n  }\n}": types.CheckQueriesDocument,
    "query ValidateIngestFilter($pipeline: String!, $sourceDatasetID: ObjectId!) {\n  validateIngestFilterExpression(\n    pipeline: $pipeline\n    sourceDatasetID: $sourceDatasetID\n  ) {\n    message\n  }\n}": types.ValidateIngestFilterDocument,
    "query VerbsAndFunctions {\n  verbsAndFunctions {\n    verbs {\n      name\n      description\n      categories\n    }\n    functions {\n      name\n      description\n      categories\n      returnType\n    }\n  }\n}": types.VerbsAndFunctionsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query CheckQueries($queries: MultiStageQueryInput!) {\n  checkQueries(queries: $queries) {\n    parsedPipeline {\n      errors {\n        col\n        row\n        text\n      }\n      warnings {\n        kind\n        symbol {\n          col\n          row\n        }\n      }\n    }\n    resultSchema {\n      fieldList {\n        name\n      }\n    }\n  }\n}"): (typeof documents)["query CheckQueries($queries: MultiStageQueryInput!) {\n  checkQueries(queries: $queries) {\n    parsedPipeline {\n      errors {\n        col\n        row\n        text\n      }\n      warnings {\n        kind\n        symbol {\n          col\n          row\n        }\n      }\n    }\n    resultSchema {\n      fieldList {\n        name\n      }\n    }\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query ValidateIngestFilter($pipeline: String!, $sourceDatasetID: ObjectId!) {\n  validateIngestFilterExpression(\n    pipeline: $pipeline\n    sourceDatasetID: $sourceDatasetID\n  ) {\n    message\n  }\n}"): (typeof documents)["query ValidateIngestFilter($pipeline: String!, $sourceDatasetID: ObjectId!) {\n  validateIngestFilterExpression(\n    pipeline: $pipeline\n    sourceDatasetID: $sourceDatasetID\n  ) {\n    message\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query VerbsAndFunctions {\n  verbsAndFunctions {\n    verbs {\n      name\n      description\n      categories\n    }\n    functions {\n      name\n      description\n      categories\n      returnType\n    }\n  }\n}"): (typeof documents)["query VerbsAndFunctions {\n  verbsAndFunctions {\n    verbs {\n      name\n      description\n      categories\n    }\n    functions {\n      name\n      description\n      categories\n      returnType\n    }\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;