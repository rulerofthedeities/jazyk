import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Book, Chapter, SentenceTranslation, TranslationData,
         UserBook, Bookmark, SessionData, UserData } from '../models/book.model';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';

@Injectable()
export class ReadService {

  constructor(
    private http: HttpClient
  ) {}

  /*** Books ***/

  fetchPublishedBooksByWeight(learnLanCode: string): Observable<Book[]> {
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
    // gets published book only
    return this.http
    .get<Book>('/api/book/' + bookId)
    .pipe(retry(3));
  }

  placeBookmark(bookId: string, bookmark: Bookmark, lanCode: string): Observable<Bookmark> {
    return this.http
    .put<Bookmark>('/api/book/bookmark/' + bookId + '/' + lanCode, {bookmark});
  }

  /*** Chapters ***/

  fetchChapter(bookId: string, chapterId: string, sequence: number): Observable<Chapter> {
    const chapter = chapterId ? chapterId : '0';
    return this.http
    .get<Chapter>('/api/book/chapter/' + bookId + '/' + chapter + '/' + sequence.toString())
    .pipe(retry(3));
  }

  /*** Translations ***/

  fetchSentenceTranslations(
    userLanCode: string,
    bookId: string,
    sentence: string): Observable<SentenceTranslation[]> {
    return this.http
    .get<SentenceTranslation[]>('/api/book/translations/' + bookId + '/' + userLanCode + '/' + encodeURIComponent(sentence))
    .pipe(retry(3));
  }

  addSentenceTranslation(
    bookLanCode: string,
    userLanCode: string,
    bookId: string,
    sentence: string,
    translation: string,
    note: string): Observable<SentenceTranslation> {
    return this.http
    .post<SentenceTranslation>('/api/book/translation/', {
      bookLanCode, userLanCode, bookId, sentence, translation, note
    });
  }

  fetchTranslationData(bookLanCode: string, userLanCode: string): Observable<TranslationData[]> {
    // count the # of translations for all books into a specific language
    return this.http
    .get<TranslationData[]>('/api/book/translation/' + bookLanCode + '/' + userLanCode);
  }

  /*** Session data ***/

  saveSessionData(sessionData: SessionData, startDate: Date): Observable<string>  {
    if (sessionData._id) {
      // Update session data
      return this.http
      .put<string>('/api/book/session', {sessionData, startDate});
    } else {
      // New session data
      return this.http
      .post<string>('/api/book/session', {sessionData, startDate});
    }
  }

  fetchSessionData(learnLanCode: string): Observable<UserData[]> {
    return this.http
    .get<UserData[]>('/api/book/sessions/' + learnLanCode)
    .pipe(retry(3));
  }

  fetchPreviousAnswers(bookId: string, userLanCode: string): Observable<string[]> {
    return this.http
    .get<string[]>('/api/book/sessions/book/' + bookId + '/' + userLanCode)
    .pipe(retry(3));
  }
}
