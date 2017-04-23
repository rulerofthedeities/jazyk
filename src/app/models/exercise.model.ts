export interface Filter {
  word: string;
  languageId: string;
  isFromStart: boolean;
  isExact: boolean;
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
  images?: string[];
  audio?: string[];
  conjugation?: Conjugation;
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
  casesensitive?: boolean;
}

export interface Exercise {
  _id?: string;
  nr: number;
  lessonId: string;
  wordPairDetailId: string;
  languagePair: string;
  exerciseTypes: Array<ExerciseType>;
  wordTpe: string;
  cs?: ExerciseWord;
  de?: ExerciseWord;
  fr?: ExerciseWord;
  gb?: ExerciseWord;
  nl?: ExerciseWord;
  us?: ExerciseWord;
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
  isDefault: boolean;
  isOption?: boolean;
  isSelected?: boolean;
};
