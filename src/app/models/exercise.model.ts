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
  study: ExerciseTpe;
  practise: ExerciseTpe;
  test: ExerciseTpe;
  exam: ExerciseTpe;
}

export enum Direction {LocalToForeign, ForeignToLocal};

export interface ExerciseExtraData {
  nrOfChoices?: number;
  wordForeign?: string;
  wordLocal?: string;
  isDone?: boolean;
  isCorrect?: boolean;
  isAlt?: boolean;
  isAlmostCorrect?: boolean;
  answered: number;
  direction: Direction;
  annotations?: string[];
  genus?: string;
  suffix?: string;
  hint?: string;
  info?: string;
  grade?: number;
}

export interface ExerciseData {
  exercise: Exercise;
  data: ExerciseExtraData;
}

export interface ExerciseOptions {
  nrOfChoices?: number;
  isForeign?: boolean;
  isBidirectional?: boolean;
  direction: Direction;
}

export interface LearnSettings {
  mute: boolean;
  color: boolean;
  delay: number; // # of seconds before local word appears
  keyboard: boolean;
}
