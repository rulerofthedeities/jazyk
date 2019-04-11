import { Sentence, SentenceTranslation, MergedChapter } from './book.model';

export interface SentenceData {
  sentenceNrChapter: number;
  sentenceNrTotal: number;
  sentence?: Sentence;
  // sentenceId?: string;
  answers?: string;
  lastAnswer?: string;
  hasTranslation?: boolean;
  translations?: SentenceTranslation[];
  bestTranslation?: SentenceTranslation;
}

export interface ChapterData {
  chapterId: string;
  mergedChapters?: MergedChapter[];
  title: string;
  level: number;
  sequence: number;
  nrOfSentences: number;
  sentences: SentenceData[];
  paragraphs: SentenceData[][]; // For revision
  expanded: boolean;
  ready: boolean; // all data for this chapter has been loaded
}
