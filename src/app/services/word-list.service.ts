import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Word, UserWord, WordTranslations, UserWordData, FlashCardData, AnswerData, FlashCard } from '../models/word.model';
import { retry } from 'rxjs/operators';
import { SessionData } from 'app/models/book.model';

interface TranslationScore {
  position: number;
  count: number;
  word: string;
  score?: number;
}

@Injectable()
export class WordListService {

  constructor(
    private http: HttpClient
  ) {}

  fetchUserWordCounts(bookLanCode: string, targetLanCode: string): Observable<UserWordData[]> {
    return this.http
    .get<UserWordData[]>(`/api/userwordlists/count/${bookLanCode}/${targetLanCode}`)
    .pipe(retry(3));
  }

  fetchBookWordCounts(bookLanCode: string, targetLanCode: string): Observable<UserWordData[]> {
    return this.http
    .get<UserWordData[]>(`/api/bookwordlists/count/${bookLanCode}/${targetLanCode}`)
    .pipe(retry(3));
  }

  fetchWordList(bookId: string): Observable<Word[]> {
    return this.http
    .get<Word[]>(`/api/wordlist/${bookId}`)
    .pipe(retry(3));
  }

  fetchUserWordList(bookId: string, userLanCode: string): Observable<UserWord[]> {
    return this.http
    .get<UserWord[]>(`/api/userwordlist/${bookId}/${userLanCode}`)
    .pipe(retry(3));
  }

  fetchFlashcardWords(bookId: string, userLanCode: string, max: number, tpe: string): Observable<FlashCardData> {
    if (tpe === 'my') {
      return this.http
      .get<FlashCardData>(`/api/userwordlist/flashcards/${bookId}/${userLanCode}/${max}`)
      .pipe(retry(3));
    } else {
      return this.http
      .get<FlashCardData>(`/api/wordlist/flashcards/${bookId}/${userLanCode}/${max}`)
      .pipe(retry(3));
    }
  }

  pinWord(word: Word, bookId: string, summary: string, pin: boolean): Observable<boolean> {
    return this.http
    .put<boolean>(`/api/wordlist/my/pin`, {word, bookId, summary, pin});
  }

  unPinWord(word: Word, bookId: string, userLanCode: string): Observable<boolean> {
    return this.http
    .put<boolean>(`/api/wordlist/my/unpin`, {word, bookId, userLanCode});
  }

  pinWords(words: Word[], bookId: string): Observable<boolean> {
    return this.http
    .put<boolean>(`/api/wordlist/my/pins`, {words, bookId});
  }

  saveSession(sessionData: SessionData): Observable<boolean> {
    return this.http
    .post<boolean>(`/api/wordlist/flashcards/session`, {sessionData});
  }

  saveAnswers(flashCardsToSave: FlashCard[], bookId: string, bookLanCode: string, targetLanCode: string): Observable<boolean> {
    return this.http
    .post<boolean>(`/api/wordlist/flashcards/answers`, {flashCardsToSave, bookId, bookLanCode, targetLanCode});
  }

  updateUserTranslation(bookId: string, wordId: string, newTranslation: string, userLanCode: string) {
    return this.http
    .put<boolean>(`/api/userwordlist/word`, {bookId, wordId, newTranslation, userLanCode});
  }

  createTranslationsSummary(wordTranslations: WordTranslations, separator = ', '): string {
    const translations: TranslationScore[] = [];
    let summary: string[] = [],
        sameTranslation: TranslationScore;
    if (wordTranslations) {
      wordTranslations.translations.forEach((tl, i) => {
        if (tl.translation !== '<none>') {
          sameTranslation = translations.find(t => t.word === tl.translation);
          if (sameTranslation) {
            sameTranslation.count ++;
            sameTranslation.position = Math.min(sameTranslation.position, i);
          } else {
            translations.push({
              position: i,
              word: tl.translation,
              count: 1
            });
          }
        }
      });
      translations.map(tl => tl.score = tl.count - (tl.position * 2));
      // Sort by score
      translations.sort((a, b) => (a.score > b.score) ? -1 : ((b.score > a.score) ? 1 : 0));
      summary = translations.map(tl => tl.word);
    }
    return summary.join(separator);
  }

}
