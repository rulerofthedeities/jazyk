import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SessionData, Chapter, RevisionTranslations } from '../models/book.model';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';

@Injectable()
export class RevisionService {

  constructor(
    private http: HttpClient
  ) {}

  fetchSessionData(
    bookId: string,
    bookType: string,
    userLanCode: string
  ): Observable<SessionData[]> {
    return this.http
    .get<SessionData[]>(`/api/revision/sessions/${bookId}/${bookType}/${userLanCode}`)
    .pipe(retry(3));
  }

  fetchChapter(chapterId: string): Observable<Chapter> {
    return this.http
    .get<Chapter>(`/api/revision/chapter/${chapterId}`)
    .pipe(retry(3));
  }

  /*
  fetchTranslations(bookId: string, bookLanCode: string, userLanCode: string): Observable<RevisionTranslations[]> {
    return this.http
    .get<RevisionTranslations[]>(`/api/revision/translations/${bookId}/${bookLanCode}/${userLanCode}`)
    .pipe(retry(3));
  }
  */
}
