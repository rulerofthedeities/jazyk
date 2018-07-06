export enum Direction {LocalToForeign, ForeignToLocal}
export enum AnsweredType {Correct, Incorrect, AlmostCorrect, Alt}
export enum ExerciseType {Word, Select, QA, FillIn, Genus, Article, Comparison, Conjugations}
export enum QuestionType {Choices, Word, Select, FillIn, Comparison, Conjugations, Preview}

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
  lessonId?: string; // for uniqueness across course
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
  dialogue: ExerciseStep;
  study: ExerciseStep;
  practise: ExerciseStep;
  exam: ExerciseStep;
}

export interface ExerciseUnid { // exercise id is only unique within a lessonId
  exerciseId: string;
  lessonId: string;
}

export interface ExerciseResult {
  _id?: string;
  userId?: string;
  courseId?: string;
  lessonId?: string;
  exerciseId?: string;
  exerciseUnid?: ExerciseUnid;
  tpe?: number;
  points?: number;
  learnLevel?: number;
  isLearned?: boolean;
  isRepeat?: boolean;
  isDifficult?: boolean;
  sequence?: number; // To find the last saved doc for docs with same save time
  dt?: Date;
  dtToReview?: Date;
  daysBetweenReviews?: number;
  streak?: string;
  timesDone?: number;
  timesCorrect?: number;
}

export interface ResultsData {
  last: ExerciseResult[];
  count: ExerciseResult[];
}

export interface Points {
  base: number; // fixed score depending on exercise type
  length: number; // length of word - spaces
  time: number;
  streak: number; // correct streak
  age: number; // bonus for time between current and last test
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
  streak?: string; // temporary streak for 1 session
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

export interface ConjugationsData {
  answers: string[];
  solutions: string[];
  alts: string[];
}
