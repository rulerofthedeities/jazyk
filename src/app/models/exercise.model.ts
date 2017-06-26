export interface Filter {
  word: string;
  languageId: string;
  isFromStart: boolean;
  isExact: boolean;
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
  case?: string;
  followingCase?: string;
  genus?: string;
  plural?: string;
  diminutive?: string;
  comparative?: string;
  superlative?: string;
  aspect?: string;
  aspectPair?: string;
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

interface ExerciseWord {
  word: string;
  aspect?: boolean;
  followingCase?: boolean;
  genus?: boolean;
}

export interface Exercise {
  _id?: string;
  nr: number;
  wordPairDetailId: string;
  tpes: Array<number>;
  wordTpe: string;
  score: number;
  image?: string;
  audios?: string[];
  cs?: ExerciseWord;
  de?: ExerciseWord;
  fr?: ExerciseWord;
  gb?: ExerciseWord;
  nl?: ExerciseWord;
  us?: ExerciseWord;
}

export interface ExerciseTpes {
  learn: boolean;
  practise: boolean;
  test: boolean;
  exam: boolean;
}

/*
export enum TestDirection {
  fromNl = -1,
  same = 0,
  toNl = 1
};

export interface TestType {
  nr: number;
  label: string;
  direction: ExerciseDirection;
  isDefault: boolean;
  isOption?: boolean;
  isSelected?: boolean;
};
*/
