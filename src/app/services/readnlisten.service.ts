import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Book, Chapter, UserBook, UserData, TranslationData, Bookmark,
         SessionData, SentenceTranslation } from '../models/book.model';
import { Observable, Subject } from 'rxjs';
import { retry } from 'rxjs/operators';

@Injectable()
export class ReadnListenService {
  audioEnded = new Subject<boolean>();

  constructor(
    private http: HttpClient
  ) {}

  audioHasEnded(ended: boolean) {
    this.audioEnded.next(ended);
  }

  /*** Books ***/

  fetchPublishedAudioBooks(readLanCode: string, sort: string): Observable<Book[]> {
    return this.http
    .get<Book[]>('/api/audiobooks/published/' + readLanCode + '/' + sort)
    .pipe(retry(3));
  }

  fetchBook(bookId: string, bookType: string): Observable<Book> {
    // gets published book only
    const bookPath = bookType === 'listen' ? 'audiobook' : 'book';
    return this.http
    .get<Book>(`/api/${bookPath}/${bookId}`)
    .pipe(retry(3));
  }

  /*** Chapters ***/

  fetchChapter(bookId: string, bookType: string, chapterId: string, sequence: number): Observable<Chapter> {
    const chapter = chapterId ? chapterId : '0',
          bookPath = bookType === 'listen' ? 'audiobook' : 'book';
    return this.http
    .get<Chapter>(`/api/${bookPath}/chapter/${bookId}/${chapter}/${sequence.toString()}`)
    .pipe(retry(3));
  }

  /*** Subscriptions ***/

  fetchUserBooks(interfaceLanCode: string, bookType: string): Observable<UserBook[]> {
    return this.http
    .get<UserBook[]>('/api/books/user/' + interfaceLanCode + '/' + bookType)
    .pipe(retry(3));
  }

  placeBookmark(bookId: string, bookmark: Bookmark, lanCode: string, bookType: string): Observable<Bookmark> {
    return this.http
    .put<Bookmark>('/api/book/bookmark/' + bookId + '/' + lanCode + '/' + bookType, {bookmark});
  }

  /*** Session Data ***/

  fetchSessionData(learnLanCode: string, bookType: string): Observable<UserData[]> {
    return this.http
    .get<UserData[]>('/api/book/sessions/' + learnLanCode + '/' + bookType)
    .pipe(retry(3));
  }

  saveSessionData(sessionData: SessionData): Observable<SessionData>  {
    console.log('saving session data', sessionData);
    if (sessionData._id) {
      // Update session data
      return this.http
      .put<SessionData>('/api/book/session', {sessionData});
    } else {
      // New session data
      return this.http
      .post<SessionData>('/api/book/session', {sessionData});
    }
  }

  /*** Translations ***/

  fetchTranslationData(userLanCode: string, bookType: string): Observable<TranslationData[]> {
    // count the # of translations for all books into a specific language
    return this.http
    .get<TranslationData[]>('/api/book/translation/' + userLanCode);
  }

  addSentenceTranslation(
    bookLanCode: string,
    userLanCode: string,
    bookId: string,
    sentence: string,
    translation: string,
    note: string): Observable<{translation: SentenceTranslation, translationsId: string}> {
    return this.http
    .post<{translation: SentenceTranslation, translationsId: string}>('/api/book/translation/', {
      bookLanCode, userLanCode, bookId, sentence, translation, note
    });
  }
}
