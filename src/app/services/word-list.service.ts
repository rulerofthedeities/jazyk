import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Word } from '../models/word.model';
import { retry } from 'rxjs/operators';

@Injectable()
export class WordListService {

  constructor(
    private http: HttpClient
  ) {}

  fetchWordList(bookId: string): Observable<Word[]> {
    return this.http
    .get<Word[]>(`/api/wordlist/${bookId}`)
    .pipe(retry(3));
  }

  toggleMyWordList(word: Word): Observable<boolean> {
    return this.http
    .put<boolean>(`/api/wordlist/my/toggle`, {word})
    .pipe(retry(3));
  }
}
