export enum Alignment {Left, Center, Right}

export interface ColumnOptions {
  align: Alignment;
  inverse: boolean;
}

export interface TableOptions {
  cells: string[];
  first?: boolean;
  last?: boolean;
  alignment?: string[];
  columns?: ColumnOptions[];
  hasHeader?: boolean;
}

export interface SnippetOptions {
  title?: string;
  format?: string;
  url?: string;
  content?: string;
  value?: number;
  audioNr?: number;
  table?: TableOptions;
}

export interface ReplaceOptions {
  tag: string;
  html: string;
  oldText: string;
  newText: string;
  hasClosingTag?: boolean;
  hasBracket?: boolean;
}

export interface TagOptions {
  text: string;
  tag: string;
  hasClosingTag?: boolean;
  hasBracket?: boolean;
}
