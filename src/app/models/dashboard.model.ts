import { Message, Notification } from './user.model';
import { Book, UserBook, TranslationData, UserData } from './book.model';

interface Learning {
  countStarted: number;
  countNotSubscribed: number;
  finished: number;
}

export interface SummaryData {
  score: number;
  wordsMemorized: number;
  read: Learning;
  listen: Learning;
}

export interface CommunicationData {
  messages: Message[];
  notifications: Notification[];
}

export interface RecentBook {
  dt: Date;
  uBook: UserBook;
  book: Book;
  sessions: UserData[];
  targetLanCode: string;
}

export interface HomeStats {
  nrOfAudioBooks: number;
  nrOfBooks: number;
  nrOfSentences: number;
  nrOfTranslations: number;
  nrOfGlossaries: number;
  nrOfWords: number;
}
