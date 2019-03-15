import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Word, UserWord, WordDefinition, OmegaDefinitions, OmegaDefinition, WordTranslation, WordTranslations } from '../models/word.model';
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

  fetchOmegaDefinitionLocal(word: string): Observable<OmegaDefinition[]> {
    return this.http
    .get<OmegaDefinition[]>(`/api/wordlist/word/definition/omega/local/${word}`)
    .pipe(retry(3));
  }

  fetchOmegaDefinitionExternal(word: string): Observable<WordDefinition> {
    return this.http
    .get<WordDefinition>(`/api/wordlist/word/definition/omega/ext/${word}`)
    .pipe(retry(3));
  }

  saveOmegaDefinitions(definitions: OmegaDefinitions): Observable<OmegaDefinition[]> {
    return this.http
    .post<OmegaDefinition[]>(`/api/wordlist/word/definition/omega`, {definitions});
  }

  saveTranslations(bookLanCode: string, word: string, translations: WordTranslation[]): Observable<WordTranslation[]> {
    return this.http
    .post<WordTranslation[]>(`/api/wordlist/word/translation`, {bookLanCode, word, translations});
  }

  fetchTranslations(bookLan: string, words: string[]): Observable<WordTranslations[]> {
    console.log('Fetching translations', words);
    return this.http
    .put<WordTranslations[]>(`/api/wordlist/word/translations`, {words, lanCode: bookLan})
    .pipe(retry(3));
  }

  fetchOmegaTranslation(word: string, omegaLanId: string): Observable<string> {
    return this.http
    .get<string>(`/api/wordlist/word/translate/omega/${omegaLanId}/${word}`)
    .pipe(retry(3));
  }

}
