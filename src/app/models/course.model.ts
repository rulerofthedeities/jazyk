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
  nr: number;
  name: string;
}

export interface Lesson {
  _id?: string;
  courseId: string;
  languagePair: LanPair;
  name: string;
  nr: number;
  chapter: string;
  exerciseTpes: ExerciseTpes;
  exercises: Exercise[];
  difficulty: number;
  isPublished: boolean;
}

export interface Translation {
  key: string,
  txt: string
}