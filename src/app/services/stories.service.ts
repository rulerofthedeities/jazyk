import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Book, BookCount, UserBookActivity, UserBookLean, UserDataLean, TranslationData,
        FinishedData, UserBook } from '../models/book.model';
import { UserWordCount, UserWordData } from '../models/word.model';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';

@Injectable()
export class StoriesService {

  constructor(
    private http: HttpClient
  ) {}

  fetchBooksCount(bookType: string): Observable<BookCount[]> {
    return this.http
    .get<BookCount[]>(`/api/books/count/${bookType}`)
    .pipe(retry(3));
  }

  fetchPublishedBooks(readLanCode: string, sort: string): Observable<Book[]> {
    return this.http
    .get<Book[]>('/api/books/published/' + readLanCode + '/' + sort)
    .pipe(retry(3));
  }

  fetchActivity(): Observable<UserBookActivity[]> {
    return this.http
    .get<UserBookActivity[]>('/api/stories/activity')
    .pipe(retry(3));
  }

  fetchUserBooks(targetLanCode: string, bookType: string): Observable<UserBookLean[]> {
    return this.http
    .get<UserBookLean[]>('/api/stories/userbooks/' + targetLanCode + '/' + bookType)
    .pipe(retry(3));
  }

  fetchStoryUserBooks(targetLanCode: string, bookType: string, bookId: string): Observable<UserBookLean[]> {
    return this.http
    .get<UserBookLean[]>(`/api/story/user/${targetLanCode}/${bookType}/${bookId}`)
    .pipe(retry(3));
  }

  fetchUserWords(targetLanCode: string): Observable<UserWordData[]> {
    return this.http
    .get<UserWordData[]>(`/api/stories/userwords/${targetLanCode}`)
    .pipe(retry(3));
  }

  fetchStoryUserWords(targetLanCode: string, bookId: string): Observable<UserWordData> {
    return this.http
    .get<UserWordData>(`/api/story/userwords/${targetLanCode}/${bookId}`)
    .pipe(retry(3));
  }

  fetchStoryBookWords(targetLanCode: string, bookId: string): Observable<UserWordCount> {
    return this.http
    .get<UserWordCount>(`/api/story/bookwords/${targetLanCode}/${bookId}`)
    .pipe(retry(3));
  }

  fetchSessionData(targetLanCode: string, bookType: string): Observable<UserDataLean[]> {
    return this.http
    .get<UserDataLean[]>(`/api/stories/sessions/${targetLanCode}/${bookType}`)
    .pipe(retry(3));
  }

  fetchStorySessionData(targetLanCode: string, bookType: string, bookId: string): Observable<UserDataLean[]> {
    return this.http
    .get<UserDataLean[]>(`/api/story/sessions/${targetLanCode}/${bookType}/${bookId}`)
    .pipe(retry(3));
  }

  fetchTranslationData(targetLanCode: string): Observable<TranslationData[]> {
    // count the # of translations for all books into a specific language
    return this.http
    .get<TranslationData[]>('/api/stories/translation/' + targetLanCode);
  }

  fetchStoryTranslationData(targetLanCode: string, bookId: string): Observable<TranslationData> {
    return this.http
    .get<TranslationData>(`/api/story/translation/${targetLanCode}/${bookId}`);
  }

  fetchFinishedData(targetLanCode: string): Observable<FinishedData[]> {
    // check which tabs are finished
    return this.http
    .get<FinishedData[]>('/api/stories/finished/' + targetLanCode);
  }

  unSubscribeFromBook(ubookId: string): Observable<UserBook> {
    return this.http
    .post<UserBook>('/api/book/unsubscribe', {ubookId});
  }

  subscribeToBook(bookId: string, lanCode: string, bookType: string, isTest: boolean): Observable<UserBook> {
    return this.http
    .post<UserBook>('/api/book/subscribe', {bookId, lanCode, bookType, isTest});
  }

  recommendBook(ubookId: string, recommend: Boolean): Observable<UserBook> {
    return this.http
    .put<UserBook>('/api/book/recommend', {ubookId, recommend});
  }

  fetchUserWordCounts(bookLanCode: string, targetLanCode: string): Observable<UserWordCount[]> {
    return this.http
    .get<UserWordCount[]>(`/api/userwordlists/count/${bookLanCode}/${targetLanCode}`)
    .pipe(retry(3));
  }

  fetchBookWordCounts(bookLanCode: string, targetLanCode: string): Observable<UserWordCount[]> {
    return this.http
    .get<UserWordCount[]>(`/api/bookwordlists/count/${bookLanCode}/${targetLanCode}`)
    .pipe(retry(3));
  }
}
