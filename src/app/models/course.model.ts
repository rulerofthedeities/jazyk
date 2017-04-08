export interface Language {
  _id: string;
  name: string;
  active: boolean;
}

export interface Chapter {
  nr: number;
  name: string;
}

export interface Lesson {
  _id?: string;
  courseId: string;
  name: string;
  nr: number;
  chapter?: Chapter;
  difficulty: number;
  isPublished: boolean;
}

export interface Course {
  _id?: string;
  languageId: string;
  name: string;
  attendance: number;
  difficulty: number;
  isPublic: boolean;
  isPublished: boolean;
}
