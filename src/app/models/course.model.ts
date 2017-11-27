import {Exercise, ExerciseSteps} from './exercise.model';

export enum CourseListType {Learn, Teach, All};

export interface Language {
  _id: string;
  name: string;
  interface: boolean;
  active: boolean;
  nativeName: string;
  article: boolean;
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

export interface LessonId { // for sorting
  chapter: string;
  lessonIds: string[];
}

export interface CourseDefaults {
  caseSensitive: boolean;
  addArticle: boolean;
}

export interface Course {
  _id?: string;
  languagePair: LanPair;
  name: string;
  image: string;
  attendance: number;
  defaults: CourseDefaults;
  difficulty: number;
  isPublic: boolean;
  isPublished: boolean;
  isInProgress: boolean;
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
