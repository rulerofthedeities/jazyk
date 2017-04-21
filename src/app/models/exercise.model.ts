export interface Filter {
  word: string;
  languageId: string;
  isFromStart: boolean;
}

interface Conjugation {
  singular: string[];
  plural: string[];
}

interface Word {
  detailId: string;
  word: string;
  alt?: string;
  hint?: string;
  info?: string;
  wordCount: number;
  score: number;
}

export interface WordPair {
  _id: string;
  docTpe: string;
  wordTpe: string;
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
  conjugation?: Conjugation;
}

export interface WordPairDetail {
  wordPair: WordPair;
  cs?: WordDetail;
  de?: WordDetail;
  fr?: WordDetail;
  gb?: WordDetail;
  nl?: WordDetail;
  us?: WordDetail;
}

export interface Exercise {
  wordPairId: string;
  evxerciseTypes: Array<ExerciseType>;
}

export enum ExerciseDirection {
  fromNl = -1,
  same = 0,
  toNl = 1
};

export interface ExerciseType {
  nr: number;
  label: string;
  direction: ExerciseDirection;
  isOption?: boolean;
  isSelected?: boolean;
};
