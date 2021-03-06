import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SessionData, Sentence, RevisionTranslations } from '../models/book.model';
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

  fetchChapter(bookId: string, chapterId: string): Observable<Sentence[]> {
    return this.http
    .get<Sentence[]>(`/api/revision/sentences/${bookId}/${chapterId}`)
    .pipe(retry(3));
  }

  fetchChapterTranslations(
    bookId: string,
    bookLanCode: string,
    userLanCode: string,
    chapterSequence: number
  ): Observable<RevisionTranslations[]> {
    return this.http
    .get<RevisionTranslations[]>(`/api/revision/translations/${bookId}/${bookLanCode}/${userLanCode}/${chapterSequence}`)
    .pipe(retry(3));
  }

}
