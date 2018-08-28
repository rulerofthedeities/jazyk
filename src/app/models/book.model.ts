export enum SentenceSteps {Question, Answered, Translations, Results}

export interface Sentence {
  text: string;
  isNewParagraph?: boolean;
  isEmptyLine?: boolean;
  isHeader?: boolean;
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
  nrOfUniqueSentences: number;
  nrOfWords: number;
  totalScore: number;
  avgLengthScore: number;
  avgWordScore: number;
  avgLength: number;
  weight: number;
  uniqueWordScore: number;
  uniqueSentenceScore: number;
  tpeMultiplicator: number;
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
  license: string;
  link: string;
  difficulty: Difficulty;
  isPublished: boolean;
}

export interface UserBookDates {
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

export interface TranslationData {
  bookId: string;
  count: number;
}

export interface Bookmark {
  chapterId: string;
  sentenceNrChapter: number;
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

interface Points {
  words: number;
  translations: number;
  finished: number;
}

export interface SessionData {
  _id?: string;
  bookId: string;
  lanCode: string;
  answers: string;
  chapters: number;
  nrYes: number;
  nrNo: number;
  nrMaybe: number;
  translations: number;
  points: Points;
}

// Session data returned for one user
export interface UserData {
  bookId: string;
  nrSentencesDone: number;
  nrYes: number;
  nrNo: number;
  nrMaybe: number;
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
