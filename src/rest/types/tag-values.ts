export enum TagKind {
  Metric = "Metric",
  Correlation = "Correlation",
}

export type TagValuesSearchMode = "Regex" | "Semantic";

export interface TagValuePair {
  name: string;
  value: string;
  kind: TagKind;
}

export interface Meta {
  totalCount: number;
}

export interface TagValuesResponse {
  tagValuePairs: TagValuePair[];
  meta: Meta;
}
