export enum Direction {LocalToForeign, ForeignToLocal};
export enum AnsweredType {Correct, Incorrect, AlmostCorrect, Alt};
export enum ExerciseType {Word, Select, QA, FillIn, Genus, Article, Comparison};
export enum QuestionType {Choices, Word, Select, FillIn, Comparison, Preview};

export interface ExerciseWord {
  word: string;
  annotations?: string;
  hint?: string;
  info?: string;
  alt?: string;
  region?: string;
}

export interface RegionAudio {
  s3: string;
  region?: string;
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
  audio?: RegionAudio;
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
  lessonId?: string;
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

export interface Points {
  base: number; // fixed score depending on exercise type
  length: number; // length of word - spaces
  time: number;
  streak: number; // correct streak
  new: number; // new word bonus = 10-streak length
  correct: number; // bonus for % correct in whole test
  fixed: Function; // base + length
  bonus: Function; // time + streak + new + correct
  totalmincorrect: Function; // base + length + time + streak + new
  total: Function;
}

export interface TimeCutoffs {
  green: number;
  orange: number;
  red: number;
  total: Function;
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
  points?: Points;
  timeCutoffs?: TimeCutoffs;
  timeDelta?: number;
  learnLevel?: number;
  isLearned?: boolean;
  isCaseSensitive?: boolean;
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
  localArticle?: string;
  foreignArticle?: string;
}
