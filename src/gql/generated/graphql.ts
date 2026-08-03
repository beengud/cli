/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export const DocumentationCategory = {
  Aggregate: 'Aggregate',
  Filter: 'Filter',
  Join: 'Join',
  Metadata: 'Metadata',
  Metrics: 'Metrics',
  Misc: 'Misc',
  Presentation: 'Presentation',
  Projection: 'Projection'
} as const;

export type DocumentationCategory = typeof DocumentationCategory[keyof typeof DocumentationCategory];
export type InputDefinitionInput = {
  /** Datasets defined by IDs refer to latest-published version of dataset. */
  datasetId?: string | null | undefined;
  /** Format of datasetPath is projectlabel.datasetlabel */
  datasetPath?: string | null | undefined;
  /** Assign the short and unique user mnemonic for this input, used in @tableref expressions */
  inputName: string;
  /** If this input is to be used for a purpose other than "slurp data," then specify that here. */
  inputRole?: InputRole | null | undefined;
  /**
   * If this input is parameterized, this will contain the ID of the parameter to substitute for this input. Parameters
   * are bound in the QueryParams for the query being issued with this input.
   */
  parameterId?: string | null | undefined;
  /**
   * Reference a previous query in the worksheet by label
   * @deprecated use stageId
   */
  stageID?: string | null | undefined;
  stageId?: string | null | undefined;
};

/**
 * Why do we separate "Data" bindings from "Reference" bindings? Why does this
 * have to be pre-declared, rather than resolved at the end by the compiler?
 *
 * Because we have the hard rule that physical dataset IDs only exist in the
 * API, not at the OPAL level, we wouldn't know which particular dataset you'd
 * suggest to use, unless the input binding was pre-declared.  If we just made
 * something up in GetTargetDatasetBinding() then how would we later know which
 * shape to resolve it to?
 *
 * The user writes addfk "some name", id=@theThing.id
 *
 * We need to know what theThing really means. Hence, it needs a binding. Hence,
 * when bindings are specified, we need to know whether you expect that to be
 * 100% defined, or left pending.  We could allow a less concrete pipeline
 * specification. Leave @theThing entirely unresolved, and only resolve it using
 * some later operation that says "and wherever I called something @theThing,
 * now I mean this thing!" (edited)
 *
 * Which means that we have to live with pipelines that are constantly in
 * unresolved and unresolvable states, and only some pipelines can run. We also
 * can no longer preview the data until that next step has been taken.
 *
 * I e, we assume each query (set of stages) compiles and links as a unit. There
 * is no separate compilation, because the user experience and complexity of
 * that abstraction seems unnecessary just to solve this one use case in this
 * one alternative way.
 */
export const InputRole = {
  Data: 'Data',
  Default: 'Default',
  Reference: 'Reference'
} as const;

export type InputRole = typeof InputRole[keyof typeof InputRole];
export type MultiStageQueryInput = {
  layout?: unknown;
  outputStage: string;
  parameterValues?: Array<ParameterBindingInput> | null | undefined;
  parameters?: Array<ParameterSpecInput> | null | undefined;
  stages: Array<StageQueryInput>;
};

/**
 * Parameter values for queries (and defaults) are specified with
 * ParameterBindingInput.
 *
 * For APIs that take a raw StageInput array, the parameterValues argument is in
 * parallel.  For APIs that take MultiStageQueryInput, parameterValues are part
 * of that query.
 */
export type ParameterBindingInput = {
  id: string;
  value: ValueInput;
};

/**
 * Whever you can "save" a worksheet-like entity, you can also save the
 * parameters that go with it. This is so that the worksheet component in the FE
 * can have a unified API to work against. You can also save the parameterValues
 * to go with it as well.
 */
export type ParameterSpecInput = {
  /** optional default value, must match valueKind if present */
  defaultValue?: ValueInput | null | undefined;
  /** opal usable id, ideally a valid C and JavaScript identifier */
  id: string;
  /** user-readable name */
  name: string;
  valueKind: ValueTypeSpecInput;
};

export const PipelineWarningKind = {
  /** A deprecated alias of a verb/function is used. */
  AliasDeprecated: 'AliasDeprecated',
  /**
   * There was a collision with one of the column names, it may have been
   * dropped or renamed
   */
  ColumnNameCollision: 'ColumnNameCollision',
  /** Type is changed with a potential precision loss */
  ColumnPrecisionLoss: 'ColumnPrecisionLoss',
  /** A deprecated verb/function specification is used. */
  Deprecated: 'Deprecated',
  /** Pipeline acceleration would be expensive. */
  ExpensiveAcceleration: 'ExpensiveAcceleration',
  /** Filter is applied to a constant expression */
  FilterOnConstant: 'FilterOnConstant',
  /** Generic warning that doesn't require any extra handling by the front end */
  Generic: 'Generic',
  /** An internal verb is used */
  Internal: 'Internal',
  /** A statement will have no effect */
  NoEffect: 'NoEffect',
  /** Pipeline may not be accelerable if published. */
  NotAccelerable: 'NotAccelerable',
  /** It is not allowed to publish this pipeline as a dataset view. */
  NotAllowedInView: 'NotAllowedInView',
  /** A subquery is unused */
  UnusedSubquery: 'UnusedSubquery'
} as const;

export type PipelineWarningKind = typeof PipelineWarningKind[keyof typeof PipelineWarningKind];
export type PrimitiveValueInput = {
  bool?: boolean | null | undefined;
  duration?: string | null | undefined;
  float64?: number | null | undefined;
  int64?: string | null | undefined;
  string?: string | null | undefined;
  timestamp?: unknown;
};

export type StageQueryInput = {
  /** make id required when we've removed all deprecated use of stageId */
  id?: string | null | undefined;
  input: Array<InputDefinitionInput>;
  layout?: unknown;
  parameterValues?: Array<ParameterBindingInput> | null | undefined;
  parameters?: Array<ParameterSpecInput> | null | undefined;
  pipeline: string;
};

export type ValueArrayInput = {
  value: Array<PrimitiveValueInput>;
};

/**
 * ValueDatasetrefInput looks a bit like InputDefinitionInput, EXCEPT
 * you can't specify a parameterId as the value of a ValueDatasetrefInput
 * (because that would make little sense.)
 */
export type ValueDatasetrefInput = {
  datasetId?: string | null | undefined;
  datasetPath?: string | null | undefined;
  stageId?: string | null | undefined;
};

/**
 * The ValueInput specifies a value for a parameter. To specify a null value, specify
 * the particular field, but with the JSON value null. This is needed because values
 * are always of a particular type, and a generic null is not typed.
 */
export type ValueInput = {
  array?: ValueArrayInput | null | undefined;
  bool?: boolean | null | undefined;
  datasetref?: ValueDatasetrefInput | null | undefined;
  duration?: string | null | undefined;
  float64?: number | null | undefined;
  int64?: string | null | undefined;
  link?: ValueLinkInput | null | undefined;
  string?: string | null | undefined;
  timestamp?: unknown;
};

export type ValueKeyValueInput = {
  name: string;
  value: PrimitiveValueInput;
};

export type ValueLinkInput = {
  datasetId: string;
  primaryKeyValue: Array<ValueKeyValueInput>;
  storedLabel?: string | null | undefined;
};

/**
 * These are the OPAL native types that can go into worksheet parameters.  Some
 * of the native OPAL types aren't (currently?) exposed to the worksheet
 * parameters, but it's likely we will expand this to the full roster over time.
 * Also, there will be other places where we send "values" into the API. For
 * example, we've dodged it so far in places like monitors, by saying "threshold
 * is always float, and facet is always string," but a generic monitor
 * specification should absolutely use ValueInput / ValueType.
 */
export const ValueType = {
  Array: 'ARRAY',
  Bool: 'BOOL',
  CorrelationTag: 'CORRELATION_TAG',
  Datasetref: 'DATASETREF',
  Duration: 'DURATION',
  Float64: 'FLOAT64',
  Int64: 'INT64',
  Link: 'LINK',
  /** be explicit about the "empty" value for the null/unknown case */
  None: 'NONE',
  String: 'STRING',
  Tag: 'TAG',
  Timestamp: 'TIMESTAMP'
} as const;

export type ValueType = typeof ValueType[keyof typeof ValueType];
export type ValueTypeSpecInput = {
  arrayItemType?: ValueTypeSpecInput | null | undefined;
  keyForDatasetId?: string | null | undefined;
  tagName?: string | null | undefined;
  type: ValueType;
};

export type CheckQueriesQueryVariables = Exact<{
  queries: MultiStageQueryInput;
}>;


export type CheckQueriesQuery = { checkQueries: Array<{ parsedPipeline: { errors: Array<{ col: string, row: string, text: string }> | null, warnings: Array<{ kind: PipelineWarningKind | null, symbol: { col: string, row: string } }> | null }, resultSchema: { fieldList: Array<{ name: string | null }> | null } | null }> };

export type ValidateIngestFilterQueryVariables = Exact<{
  pipeline: string;
  sourceDatasetID: string;
}>;


export type ValidateIngestFilterQuery = { validateIngestFilterExpression: Array<
    | { message: string }
    | { message: string }
    | { message: string }
    | { message: string }
    | { message: string }
    | { message: string }
  > | null };

export type VerbsAndFunctionsQueryVariables = Exact<{ [key: string]: never; }>;


export type VerbsAndFunctionsQuery = { verbsAndFunctions: { verbs: Array<{ name: string, description: string, categories: Array<DocumentationCategory> }>, functions: Array<{ name: string, description: string, categories: Array<string>, returnType: string }> } };


export const CheckQueriesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CheckQueries"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"queries"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MultiStageQueryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"checkQueries"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"queries"},"value":{"kind":"Variable","name":{"kind":"Name","value":"queries"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"parsedPipeline"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"errors"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"col"}},{"kind":"Field","name":{"kind":"Name","value":"row"}},{"kind":"Field","name":{"kind":"Name","value":"text"}}]}},{"kind":"Field","name":{"kind":"Name","value":"warnings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"symbol"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"col"}},{"kind":"Field","name":{"kind":"Name","value":"row"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"resultSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"fieldList"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<CheckQueriesQuery, CheckQueriesQueryVariables>;
export const ValidateIngestFilterDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ValidateIngestFilter"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pipeline"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sourceDatasetID"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ObjectId"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"validateIngestFilterExpression"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pipeline"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pipeline"}}},{"kind":"Argument","name":{"kind":"Name","value":"sourceDatasetID"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sourceDatasetID"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<ValidateIngestFilterQuery, ValidateIngestFilterQueryVariables>;
export const VerbsAndFunctionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"VerbsAndFunctions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verbsAndFunctions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"verbs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"categories"}}]}},{"kind":"Field","name":{"kind":"Name","value":"functions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"categories"}},{"kind":"Field","name":{"kind":"Name","value":"returnType"}}]}}]}}]}}]} as unknown as DocumentNode<VerbsAndFunctionsQuery, VerbsAndFunctionsQueryVariables>;