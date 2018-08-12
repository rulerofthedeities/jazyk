import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Book, UserBook, Chapter, SentenceTranslation } from '../models/book.model';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';

@Injectable()
export class ReadService {

  constructor(
    private http: HttpClient
  ) {}

  /*** Books ***/

  fetchPublishedBooks(learnLanCode: string): Observable<Book[]> {
    return this.http
    .get<Book[]>('/api/books/published/' + learnLanCode)
    .pipe(retry(3));
  }

  fetchUserBooks(interfaceLanCode: string): Observable<UserBook[]> {
    return this.http
    .get<UserBook[]>('/api/books/user/' + interfaceLanCode)
    .pipe(retry(3));
  }

  fetchUserBook(interfaceLanCode: string, bookId: string): Observable<UserBook> {
    return this.http
    .get<UserBook>('/api/book/user/' + interfaceLanCode + '/' + bookId)
    .pipe(retry(3));
  }

  fetchBook(bookId: string): Observable<Book> {
    return this.http
    .get<Book>('/api/book/' + bookId)
    .pipe(retry(3));
  }

  /*** Chapters ***/

  fetchChapter(bookId: string, sequence: number): Observable<Chapter> {
    return this.http
    .get<Chapter>('/api/book/chapter/' + bookId + '/' + sequence.toString())
    .pipe(retry(3));
  }

  /*** Translations ***/

  fetchSentenceTranslations(interfaceLanCode: string, bookId: string, sentence: string): Observable<SentenceTranslation[]> {
    return this.http
    .get<SentenceTranslation[]>('/api/book/translations/' + bookId + '/' + interfaceLanCode + '/' + sentence)
    .pipe(retry(3));
  }

  addSentenceTranslation(interfaceLanCode: string, bookId: string, sentence: string, translation: string): Observable<SentenceTranslation> {
    return this.http
    .post<SentenceTranslation>('/api/book/translation/', {lanCode: interfaceLanCode, bookId, sentence, translation});
  }
}
