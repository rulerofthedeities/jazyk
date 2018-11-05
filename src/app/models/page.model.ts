import { Book } from './book.model';

export interface Page {
  tpe: string;
  lan: string;
  name: string;
  title: string;
  text: string;
  html: string;
  index: boolean;
  loggedIn: boolean;
  loggedOut: boolean;
}

export interface BooksByLan {
   lanCode: string;
   lanName?: string;
   books: Book[];
   links?: string[];
   total: number;
 }
