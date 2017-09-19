import {Exercise, ExerciseSteps} from './exercise.model';

export interface Language {
  _id: string;
  name: string;
  active: boolean;
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

export interface Course {
  _id?: string;
  languagePair: LanPair;
  name: string;
  image: string;
  attendance: number;
  difficulty: number;
  isPublic: boolean;
  isPublished: boolean;
  exerciseCount: number;
  exercisesDone: number;
  chapters: string[];
  lessons?: LessonId[];
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
  isPublished: boolean;
}

export interface Translation {
  key: string;
  txt: string;
}
