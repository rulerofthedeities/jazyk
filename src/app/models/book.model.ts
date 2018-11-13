export enum SentenceSteps { Question, Answered, Translations, Results }

export interface Word {
  word: string;
  score: number;
  unselectable: boolean;
  pos: number;
}

export interface Sentence {
  text: string;
  words: Word[];
  isNewParagraph?: boolean;
  isEmptyLine?: boolean;
  isHeader?: boolean;
  fileName?: string;
  s3?: string;
  isDisabled?: boolean;
  sequence?: String; // For sorting
}

export interface TestAnswer {
  word: string;
  score: number;
  answerLetter: string;
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
  activeSentences?: Sentence[];
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

export interface BookDates {
  published?: Date;
  created?: Date;
}

export interface Book {
  _id: string;
  title: string;
  series: string;
  directory?: string;
  intro: string;
  source: string;
  categories: string[];
  lanCode: string;
  lanRegion: string;
  authors: string;
  narrators?: string;
  narratorLicense?: String;
  year: number;
  img: string;
  tpe: string;
  license: string;
  links: string;
  difficulty: Difficulty;
  isPublished: boolean;
  dt: BookDates;
}

export interface UserBookDates {
  dtSubscribed: Date;
  dtLastReSubscribed: Date;
  dtLastUnSubscribed: Date;
}

export interface SentenceTranslation {
  _id?: string;
  userId: string;
  elementId?: string;
  translation: string;
  note: string;
  isMachine: boolean;
  machine?: string;
  lanCode: string;
  score: number;
}

export interface TranslatedData {
  translation: SentenceTranslation;
  translationsId: string;
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
  _id?: string;
  bookId: string;
  userId: string;
  lanCode: string;
  bookType: string;
  isTest: boolean;
  subscribed: boolean;
  recommended: boolean;
  bookmark: Bookmark;
  dt: UserBookDates;
}

interface Points {
  words: number;
  translations: number;
  test: number;
  finished: number;
}

interface SessionDates {
  start: Date;
  end: Date;
  diff: number;
}

export interface ResultData {
  isFinished: boolean;
  totalBookSentences: number;
}

export interface SessionData {
  _id?: string;
  bookId: string;
  userId?: string;
  lanCode: string;
  bookType: string;
  isTest: boolean;
  answers: string;
  chapters: number;
  nrYes: number;
  nrNo: number;
  nrMaybe: number;
  translations: number;
  points: Points;
  dt?: SessionDates;
  resultData?: ResultData; // For results page
}

// Session data returned for one user
export interface UserData {
  bookId: string;
  nrSentencesDone: number;
  nrYes: number;
  nrNo: number;
  nrMaybe: number;
  isTest: boolean;
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

export interface Thumbs {
  translationElementId: string;
  nrUp: number;
  nrDown: number;
  user: boolean;
  savingUp?: boolean; // clicked up, saving now
  savingDown?: boolean; // clicked down, saving now
}

export interface Trophy {
  userId: string;
  trophy: string;
  created?: Date;
}

export  interface ViewFilter {
  hideCompleted: boolean;
  hideNotTranslated: boolean;
  hideOld: boolean;
}
