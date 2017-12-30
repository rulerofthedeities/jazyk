import {Exercise, ExerciseSteps} from './exercise.model';

export enum CourseListType {Learn, Teach, All, Home};
export enum AccessLevel {None, Reader, Author, Editor, Manager, Owner};

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

export interface Course {
  _id?: string;
  languagePair: LanPair;
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
  isPublished: boolean;
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
}
