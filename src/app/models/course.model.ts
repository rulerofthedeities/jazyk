export interface Language {
  _id: string;
  name: string;
  active: boolean;
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

export interface Chapter {
  _id?: string;
  courseId: string;
  nr: number;
  name: string;
}

export interface Lesson {
  _id?: string;
  courseId: string;
  languageId: string;
  name: string;
  nr: number;
  chapter: string;
  difficulty: number;
  isPublished: boolean;
}

export interface Question {
  wordPairId: string;
  testTypes: Array<TestType>;
}

interface TestType {
  direction: ETestDirection;
  type: ETestType;
}

enum ETestDirection {
  fromNl = -1,
  toNl = 1
};

enum ETestType {
  multipleChoiceText = 10,
  typeWordText = 20,
  typeWordPicture = 21,
  typeWordAudio = 22,
  selectWordsText = 30
};
