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
  difficulty?: number; // 0-100
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

export interface ExerciseResult {
  _id?: string;
  userId?: string;
  courseId?: string;
  exerciseId?: string;
  points?: number;
  learnLevel?: number;
  isLearned?: boolean;
  sequence?: number; // To find the last saved doc for docs with same save time
  dt?: Date;
  daysBetweenReviews?: number;
  percentOverdue?: number;
}

export enum Direction {LocalToForeign, ForeignToLocal};

export interface ExerciseExtraData {
  wordForeign?: string;
  wordLocal?: string;
  annotations?: string[];
  genus?: string;
  suffix?: string;
  hint?: string;
  info?: string;
  isDone?: boolean;
  isCorrect?: boolean;
  isAlt?: boolean;
  isAlmostCorrect?: boolean;
  answered?: number;
  direction?: Direction;
  grade?: number;
  points?: number;
  timeDelta?: number;
  learnLevel?: number;
  isLearned?: boolean;
  choices?: boolean; // true => multiple choice; false => enter word
}

export interface ExerciseData {
  exercise: Exercise;
  data: ExerciseExtraData;
  result?: ExerciseResult;
}

export interface ExerciseOptions {
  nrOfChoices?: number;
  isForeign?: boolean;
  isBidirectional?: boolean;
  direction: Direction;
}
