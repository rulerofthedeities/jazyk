export enum Direction {LocalToForeign, ForeignToLocal};
export enum AnsweredType {Correct, Incorrect, AlmostCorrect, Alt};
export enum ExerciseType {Word, Select, QA, FillIn, Genus, Comparison};
export enum QuestionType {Choices, Word, Select, FillIn, Comparison};

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
  options?: string;
  tpe?: ExerciseType;
  difficulty?: number; // 0-100
}

export interface ExerciseStep {
  active: boolean;
  bidirectional: boolean;
  ordered: boolean;
}

export interface ExerciseSteps {
  intro: ExerciseStep;
  study: ExerciseStep;
  practise: ExerciseStep;
  exam: ExerciseStep;
}

export interface ExerciseResult {
  _id?: string;
  userId?: string;
  courseId?: string;
  exerciseId?: string;
  tpe?: number;
  points?: number;
  learnLevel?: number;
  isLearned?: boolean;
  sequence?: number; // To find the last saved doc for docs with same save time
  dt?: Date;
  dtToReview?: Date;
  daysBetweenReviews?: number;
  percentOverdue?: number;
  streak?: string;
}

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
  questionType?: QuestionType;
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

export interface Choice {
  local: string;
  foreign: string;
}
