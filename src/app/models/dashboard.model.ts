import { Message, Notification } from './user.model';
import { Book, UserBook, TranslationData, UserData } from './book.model';

interface Learning {
  subscribed: number;
  unsubscribed: number;
  total: number;
  completed?: number;
}

export interface SummaryData {
  score: number;
  booksReading: Learning;
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
  translations: TranslationData;
  userLanCode: string;
  tpe: string;
}

export interface HomeStats {
  nrOfAudioBooks: number;
  nrOfBooks: number;
  nrOfSentences: number;
  nrOfTranslations: number;
  nrOfGlossaries: number;
  nrOfWords: number;
}
