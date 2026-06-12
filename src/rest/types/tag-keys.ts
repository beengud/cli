export interface TagKeyEntry {
  name: string;
  values: string[];
}

export interface Meta {
  totalCount: number;
}

export interface TagKeysResponse {
  tagKeys: TagKeyEntry[];
  meta: Meta;
}
