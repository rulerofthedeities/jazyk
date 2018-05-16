import {Exercise, ExerciseSteps} from './exercise.model';

export enum CourseListType {Learn, Teach, All, Home}
export enum AccessLevel {None, Reader, Author, Editor, Manager, Owner}

export interface Map<T> {
  [K: string]: T;
}

export interface Language {
  name: string;
  nativeName: string;
  code: string;
  interface: boolean;
  active: boolean;
  article: boolean;
  articles?: string[];
  regions?: string[];
}

export interface LanPair {
  from: string;
  to: string;
}

export interface Case {
  value: string;
  code: string;
}

export interface LanConfig  {
  tpe: string;
  code: string;
  name: string;
  articles?: string[];
  genera?: string[];
  aspects?: string[];
  cases?: Case[];
  subjectPronouns?: string[];
  regions?: string[];
  keys?: string[];
}

export interface LanConfigs {
  foreign: LanConfig;
  local: LanConfig;
}

export interface LessonId { // for sorting
  chapter: string;
  lessonIds: string[];
}

export interface CourseDefaults {
  caseSensitive: boolean;
  addArticle: boolean;
  region: string;
}

export interface UserAccess {
  userId: string;
  level: number;
}

export interface Course {
  _id?: string;
  languagePair: LanPair;
  creatorId: string;
  name: string;
  description: string;
  image: string;
  defaults: CourseDefaults;
  isPublic: boolean;
  isPublished: boolean;
  isInProgress: boolean;
  isDemo: boolean;
  totalCount: number;
  wordCount: number;
  exercisesCount?: number;
  chapters: string[];
  lessons?: LessonId[];
  access?: UserAccess[];
}

interface UserCourseDates {
  dtLastReSubscribed?: Date;
  dtLastUnSubscribed?: Date;
  dtSubscribed?: Date;
}

export interface UserCourse {
  _id?: string;
  courseId: string;
  userId: string;
  subscribed: boolean;
  dt?: UserCourseDates;
}

export interface LessonOptions {
  caseSensitive: boolean;
  addArticle: boolean;
  region: string;
}

export interface Lesson {
  _id?: string;
  courseId: string;
  languagePair: LanPair;
  name: string;
  chapterName: string;
  exerciseSteps: ExerciseSteps;
  exercises: Exercise[];
  difficulty: number;
  options: LessonOptions;
  intro?: string;
  dialogue?: Dialogue;
  rehearseStep?: string; // For repeats
  skipToStep?: string; // Jump to intro or dialog from overview
  isDeleted?: boolean;
}

export interface LessonHeader {
  _id: string;
  name: string;
  chapterName: string;
  exerciseSteps: ExerciseSteps;
}

export interface LessonResult {
  _id: string;
  studied: number;
  learned: number;
  total: number; // total nr of exercises in the lesson
  totalwords: number; // nr of exercises op tpe 0 (words) for study count
  hasStarted?: boolean;
  hasCompleted?: boolean;
  introOnly?: boolean; // is there only an intro step for this lesson
}

export interface Translation {
  key: string;
  txt: string;
}

export enum Level {Course, Lesson}

export interface Step {
  name: string;
  level: Level;
  alwaysShown: boolean;
  hasCounter: boolean;
}

export interface StepCount {
  nrDone: number;
  nrRemaining: number;
  step?: string;
}

export interface StepData {
  lesson: StepCount[];
  difficult: number;
  review: number;
}

export interface Dependables {
  translations: Translation[];
  languages: Language[];
}

export interface DependableOptions {
  lan?: string;
  component?: string;
  getTranslations?: boolean;
  getLanguages?: boolean;
}

export interface Intro {
  text: string;
  html: string;
}

export interface Dialogue {
  text: string;
  tpe: string;
  local: string;
  foreign: string;
  localTitle: string;
  foreignTitle: string;
}

export interface ResultData {
  // Save data
  exerciseId: string;
  lessonId: string;
  tpe: number;
  done: boolean;
  points: number;
  learnLevel: number;
  sequence: number; // To find the last saved doc for docs with same save time
  isLearned?: boolean;
  timeDelta?: number;
  daysBetweenReviews?: number;
  percentOverdue?: number;
  streak: string;
  isLast: boolean;
  isDifficult: boolean;
  isRepeat: boolean;
  isCorrect: boolean;
}

interface PreSaveResult {
  courseId: string;
  lessonId: string;
  step: string;
  data: ResultData[];
}

export interface ProcessedData {
  // Data processed right before save
  result: PreSaveResult;
  lastResult: Map<ResultData>;
  allCorrect: Map<boolean>;
  pointsEarned: number;
}
