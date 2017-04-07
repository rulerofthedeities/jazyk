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
  language: Language;
  name: string;
  attendance: number;
  difficulty: number;
}
