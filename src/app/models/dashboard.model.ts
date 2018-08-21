import { Course } from './course.model';
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
  coursesLearning: Learning;
  booksReading: Learning;
}

export interface CommunicationData {
  messages: Message[];
  notifications: Notification[];
}

export interface RecentCourse {
  dt: Date;
  course: Course;
  tpe: string;
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
