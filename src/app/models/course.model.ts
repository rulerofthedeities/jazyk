import {Exercise, ExerciseTpes} from './exercise.model';

export interface Language {
  _id: string;
  name: string;
  active: boolean;
}

export interface LanPair {
  from: string;
  to: string;
}

interface Lans {
  de: string;
  en: string;
  fr: string;
  nl: string;
}

export interface Case {
  value: string;
  code: string;
}

export interface LanConfig  {
  tpe: string;
  code: string;
  articles?: string[];
  genera?: string[];
  aspects?: string[];
  cases?: Case[];
  name: Lans;
  regions?: string[];
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
}

export interface Chapter {
  _id?: string;
  courseId: string;
  name: string;
}

export interface Lesson {
  _id?: string;
  courseId: string;
  languagePair: LanPair;
  name: string;
  chapter: string;
  chapterNr: number;
  exerciseTpes: ExerciseTpes;
  exercises: Exercise[];
  difficulty: number;
  isPublished: boolean;
}

export interface Translation {
  key: string;
  txt: string;
}
