export enum SentenceSteps {Question, Answered, Translations, Results}

export interface Sentence {
  text: string;
  isNewParagraph?: boolean;
}

export interface Chapter {
  _id: string;
  bookId: string;
  title: string;
  level: number;
  sequence: number;
  content: string;
  nrOfWords: number;
  nrOfUniqueWords: number;
  totalScore: number;
  chapterNr?: string;
  sentences: Sentence[];
}

interface Difficulty {
  bookId: string;
  nrOfSentences: number;
  nrOfUniqueWords: number;
  nrOfWords: number;
  totalScore: number;
  avgLengthScore: number;
  avgWordScore: number;
  avgLength: number;
  weight: number;
}

export interface Book {
  _id: string;
  title: string;
  source: string;
  categories: string[];
  lanCode: string;
  author: string;
  year: number;
  img: string;
  tpe: string;
  difficulty: Difficulty;
  isPublished: boolean;
}

interface UserBookDates {
  dtSubscribed: Date;
  dtLastReSubscribed: Date;
  dtLastUnSubscribed: Date;
}

export interface SentenceTranslation {
  translation: string;
  note: string;
  lanCode: string;
  score: number;
}

interface SentenceTranslations {
  bookId: string;
  sentence: string;
  translations: SentenceTranslation[];
}

export interface Bookmark {
  chapterId: string;
  sentenceNrChapter: number;
  sentenceNrBook?: number;
  isChapterRead: boolean;
  isBookRead?: boolean;
}

export interface UserBook {
  bookId: string;
  userId: string;
  lanCode: string;
  subscribed: boolean;
  bookmark: Bookmark;
  dt: UserBookDates;
}

export interface SessionData {
  _id?: string;
  bookId: string;
  answers: string;
  chapters: number;
  nrYes: number;
  nrNo: number;
  nrMaybe: number;
  translations: number;
}

export interface ChapterData {
  bookId: string;
  chapterId: string;
  answers: string;
  nrYes: number;
  nrNo: number;
  nrMaybe: number;
  nrSentences: number;
  translations: number;
}
