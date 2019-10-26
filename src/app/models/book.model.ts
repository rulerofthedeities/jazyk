export enum SentenceSteps { Question, Answered, Translations, Results }
import { UserWordCount, UserWordData } from './word.model';

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

export interface MergedChapter {
  chapterId: string;
  sentenceNrStart: number;
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
  index?: number[];
  indexLabel?: string;
  nrOfSentences?: number;
  activeSentences?: Sentence[];
  activeAudioSentences?: AudioSentence[];
  mergedChapters?: MergedChapter[]; // list of other chapter ids to merge in revision
  toRemove?: boolean;
}

export interface ChapterData {
  chapter: Chapter;
  sentences: Sentence[];
}

export interface AudioSentence {
  sequence: string;
  s3: string;
  text: string;
  isDisabled?: boolean;
}

export interface AudioChapter {
  title: string;
  directory: string;
  sentences: AudioSentence[];
}

export interface AudioChapterData {
  chapter: AudioChapter;
  sentences: AudioSentence[];
}

interface Difficulty {
  bookId: string;
  nrOfSentences: number;
  nrOfUniqueSentences: number;
  nrOfWords: number;
  avgWordScore: number;
  weight: number;
}

export interface BookDates {
  published?: Date;
  publishedAudio?: Date;
  publishedGlossary?: Date;
  created?: Date;
}

 interface File {
  fileName: string;
  hasMp3?: boolean;
  s3?: string;
}

export interface Book {
  _id: string;
  bookId?: string; // In case audiobook = read book
  title: string;
  series: string;
  audioDirectory?: string;
  audioTitle?: File;
  intro: string;
  credits: string;
  translator?: string;
  adaptation?: string;
  cover?: string;
  source: string;
  lanCode: string;
  lanRegion: string;
  authors: string;
  narrators?: string;
  glossaryNarrators?: string;
  licenseNarrator?: String;
  year: number;
  coverImg: string;
  tpe: string;
  license: string;
  difficulty: Difficulty;
  isPublished: boolean;
  dt: BookDates;
  nrOfWordsInList?: number;
  wordListPublished?: boolean;
  audioPublished?: boolean;
  uploadedMp3?: boolean;
  hasMp3?: boolean;
  mp3Count?: number;
  nrOfChapters?: number;
  sortScore?: number; // For sort of search results
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
  translationId?: string;
  translation: string;
  note: string;
  isMachine: boolean;
  isDuplicate?: boolean;
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

interface DeepLTranslation {
  detected_source_language: string;
  text: string;
}

export interface DeepLTranslations {
  translations: DeepLTranslation[];
}

interface MSTranslation {
  to: string;
  text: string;
}

export interface MSTranslations {
  translations: MSTranslation[];
}

export interface RevisionTranslations {
  sentence: string;
  translations: SentenceTranslation[];
}

export interface Bookmark {
  chapterId?: string;
  chapterSequence: number;
  sentenceNrChapter: number;
  isChapterRead: boolean;
  isBookRead?: boolean;
  lastGlossaryType?: string;
  dt?: Date;
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
  repeats: Date[];
  repeatCount: number;
}

export interface UserBookLean {
  // Only data fetched in stories list
  _id?: string;
  bookId: string;
  isTest: boolean;
  bookType: string;
  subscribed: boolean;
  recommended: boolean;
  bookmark: Bookmark;
  repeatCount: number;
}

export interface UserBookStatus {
  // isSubscribed: boolean; now per story summary, not per userbook
  // isRecommended: boolean; now per story summary, not per userbook
  isStarted: boolean;
  isRepeat: boolean;
  nrOfSentencesDone: number;
  nrOfSentences: number;
  isBookRead: boolean;
  percDone: number;
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

export interface UserBookActivity {
  bookId: string;
  recommended: number;
  started: number;
  finished: number;
  popularity?: number;
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
  nrYes: number;
  nrNo: number;
  nrMaybe: number;
  translations: number;
  points: Points;
  repeatCount?: number;
  glossaryType?: string;
  dt?: SessionDates;
  resultData?: ResultData; // For results page
  chapterId?: string; // For revision
  chapterSequence?: number; // For revision
  sentenceNrChapter?: number; // For revision
  lastChapterId?: string; // For integrity check
  lastChapterSequence?: number; // For integrity check
  lastSentenceNrChapter?: number; // For integrity check
  version?: string;
}

// Session data returned for one user
export interface UserData {
  bookId: string;
  isTest: boolean;
  nrSentencesDone: number;
  nrYes: number;
  nrNo: number;
  nrMaybe: number;
  repeatCount: number;
  start?: Date;
  end?: Date;
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

export interface ViewFilter {
  hideCompleted: boolean;
  hideNotTranslated: boolean;
  hideOld: boolean;
  hideEasy: boolean;
  hideMedium: boolean;
  hideAdvanced: boolean;
  bookId: string;
}

export interface BookCount {
  lanCode: string;
  count: number;
}

export interface FinishedData {
  bookId: string;
  isTest: string;
  bookType: string;
  isFinished: number;
}

export interface FinishedTab {
  read: boolean;
  listen: boolean;
  listenDefault: boolean;
  listenTest: boolean;
  glossary: boolean;
}

export interface StoryData {
  userBook?: UserBookLean;
  userBookTest?: UserBookLean;
  userData?: UserData[];
  userDataTest?: UserData[];
  translationCount?: number;
  userGlossaryCount?: UserWordCount;
  userGlossaryData?: UserWordData;
  glossaryCount?: UserWordCount;
}
