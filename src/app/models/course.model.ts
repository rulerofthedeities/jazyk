export interface Language {
  _id: string;
  name: string;
  active: boolean;
}

export interface Lesson {
  _id?: string;
  courseId: string;
  name: string;
  chapter: string;
  difficulty: number;
}

export interface Course {
  _id?: string;
  languageId: string;
  name: string;
  attendance: number;
  difficulty: number;
}
