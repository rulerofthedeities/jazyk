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

interface ExerciseForeignData {
  annotations?: string[];
  genus?: string;
  suffix?: string;
  hint?: string;
  info?: string;
}

export enum Direction {LocalToForeign, ForeignToLocal};

interface ExerciseExtraData {
  nrOfChoices?: number;
  wordForeign?: string;
  wordLocal?: string;
  foreign?: ExerciseForeignData;
  isDone?: boolean;
  isCorrect?: boolean;
  answered: number;
  direction: Direction;
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
}
