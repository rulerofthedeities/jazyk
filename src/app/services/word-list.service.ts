import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Word, UserWord, WordTranslations, UserWordData, FlashCardData, AnswerData, FlashCard } from '../models/word.model';
import { retry } from 'rxjs/operators';
import { SessionData } from 'app/models/book.model';

interface TranslationScore {
  count: number;
  word: string;
  score?: number;
}

@Injectable()
export class WordListService {

  constructor(
    private http: HttpClient
  ) {}

  fetchWordList(bookId: string): Observable<Word[]> {
    return this.http
    .get<Word[]>(`/api/wordlist/words/${bookId}`)
    .pipe(retry(3));
  }

  fetchUserWordList(bookId: string, userLanCode: string): Observable<UserWord[]> {
    return this.http
    .get<UserWord[]>(`/api/userwordlist/${bookId}/${userLanCode}`)
    .pipe(retry(3));
  }

  fetchFlashcardWords(bookId: string, targetLanCode: string, max: number, tpe: string): Observable<FlashCardData> {
    if (tpe === 'my') {
      return this.http
      .get<FlashCardData>(`/api/userwordlist/flashcards/${bookId}/${targetLanCode}/${max}`)
      .pipe(retry(3));
    } else {
      return this.http
      .get<FlashCardData>(`/api/wordlist/flashcards/${bookId}/${targetLanCode}/${max}`)
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

  saveAnswers(
    flashCardsToSave: FlashCard[],
    bookId: string,
    bookLanCode: string,
    targetLanCode: string,
    glossaryType: string
  ): Observable<boolean> {
    return this.http
    .post<boolean>(`/api/wordlist/flashcards/answers`, {
      flashCardsToSave,
      bookId,
      bookLanCode,
      targetLanCode,
      glossaryType
    });
  }

  updateUserTranslation(bookId: string, wordId: string, newTranslation: string, userLanCode: string) {
    return this.http
    .put<boolean>(`/api/userwordlist/word`, {bookId, wordId, newTranslation, userLanCode});
  }

  updateTranslationSummary(bookId: string, wordId: string, summary: string, userLanCode: string) {
    return this.http
    .put<boolean>(`/api/wordlist/summary`, {bookId, wordId, summary, userLanCode});
  }

  createTranslationsSummary(wordTranslations: WordTranslations, separator = '|'): string {
    const translations: TranslationScore[] = [];
    let summary: string[] = [],
        sameTranslation: TranslationScore,
        increase: number;
    if (wordTranslations && wordTranslations.translations) {
      wordTranslations.translations.forEach((tl, i) => {
        if (tl.translation !== '<none>') {
          increase = tl.source === 'Jazyk' ? 3 : 1; // Jazyk translation is sorted higher
          sameTranslation = translations.find(t => t.word === tl.translation);
          if (sameTranslation) {
            sameTranslation.count += increase;
          } else {
            translations.push({
              word: tl.translation,
              count: increase
            });
          }
        }
      });
      // Sort by count
      translations.sort((a, b) => (a.count > b.count) ? -1 : ((b.count > a.count) ? 1 : 0));
      summary = translations.map(tl => tl.word);
    }
    return summary.join(separator);
  }

}
