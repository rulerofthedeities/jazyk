export interface Filter {
  word: string;
  languageId: string;
  isFromStart: boolean;
  isExact: boolean;
  getTotal: boolean;
  limit: number;
}

export interface File {
  s3: string;
  local: string;
}

interface Conjugation {
  singular: string[];
  plural: string[];
}

interface Alt {
  word: string;
  detailId: string;
}

export interface Word {
  detailId: string;
  word: string;
  alt?: Alt[];
  hint?: string;
  info?: string;
}

export interface WordPair {
  _id: string;
  docTpe: string;
  langPair: string;
  cs?: Word;
  de?: Word;
  fr?: Word;
  gb?: Word;
  nl?: Word;
  us?: Word;
  tags?: string[];
}

export interface WordDetail {
  _id: string;
  lan: string;
  word: string;
  docTpe: string;
  wordTpe: string;
  region?: string;
  case?: string;
  followingCase?: string;
  genus?: string;
  plural?: string;
  diminutive?: string;
  comparative?: string;
  superlative?: string;
  isPlural?: boolean;
  isDiminutive?: boolean;
  isComparative?: boolean;
  isSuperlative?: boolean;
  aspect?: string;
  aspectPair?: string;
  motion?: string;
  images?: File[];
  audios?: File[];
  conjugation?: Conjugation;
  wordCount: number;
  score: number;
}

export interface WordPairDetail {
  _id?: string; // equals wordpair id
  wordPair: WordPair;
  cs?: WordDetail;
  de?: WordDetail;
  fr?: WordDetail;
  gb?: WordDetail;
  nl?: WordDetail;
  us?: WordDetail;
}

