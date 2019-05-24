import { Injectable, ɵlooseIdentical } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book } from '../models/book.model';
import { Word, UserWord, WordTranslations, UserWordData } from '../models/word.model';
import { retry } from 'rxjs/operators';

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

  fetchUserWordCounts(bookLanCode: string): Observable<UserWordData[]> {
    return this.http
    .get<UserWordData[]>(`/api/userwordlists/count/${bookLanCode}`)
    .pipe(retry(3));
  }

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

  pinWord(word: Word, bookId: string, summary: string, pin: boolean): Observable<Word> {
    return this.http
    .put<Word>(`/api/wordlist/my/pin`, {word, bookId, summary, pin})
    .pipe(retry(3));
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
