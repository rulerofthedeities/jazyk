import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Word, UserWord } from '../models/word.model';
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

  fetchUserWordList(bookId: string): Observable<UserWord[]> {
    return this.http
    .get<UserWord[]>(`/api/userwordlist/${bookId}`)
    .pipe(retry(3));
  }

  pinWord(word: Word, bookId: string, pin: boolean): Observable<Word> {
    return this.http
    .put<Word>(`/api/wordlist/my/pin`, {word, bookId, pin})
    .pipe(retry(3));
  }
}
