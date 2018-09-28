import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Book, Chapter, UserBook, UserData } from '../models/book.model';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';

@Injectable()
export class ReadnListenService {

  constructor(
    private http: HttpClient
  ) {}

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

  /*** Session Data ***/

  fetchSessionData(learnLanCode: string, bookType: string): Observable<UserData[]> {
    return this.http
    .get<UserData[]>('/api/book/sessions/' + learnLanCode + '/' + bookType)
    .pipe(retry(3));
  }

}
