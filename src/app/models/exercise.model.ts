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
  annotations?: string;
  hint?: string;
  info?: string;
  alt?: string;
}

export interface Exercise {
  _id?: string;
  wordDetailId?: string;
  local: ExerciseWord;
  foreign: ExerciseWord;
  wordTpe?: string;
  followingCase?: string;
  genus?: string;
  article?: string;
  aspect?: string;
  image?: string;
  audio?: string;
  score?: number;
}

export interface ExerciseTpe {
  active: boolean;
  bidirectional: boolean;
  ordered: boolean;
}

export interface ExerciseTpes {
  intro: ExerciseTpe;
  learn: ExerciseTpe;
  practise: ExerciseTpe;
  test: ExerciseTpe;
  exam: ExerciseTpe;
}

export interface ExerciseData {
  annotations: string[];
  genus: string;
  suffix: string;
}

export interface LearnSettings {
  mute: boolean;
  color: boolean;
  delay: number; // # of seconds before local word appears
}
