import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Book, Chapter, UserBook, UserData, TranslationData, Bookmark,
         SessionData, SentenceTranslation, Thumbs, Trophy } from '../models/book.model';
import { Observable, Subject } from 'rxjs';
import { retry } from 'rxjs/operators';

export const minWordScore = 150; // only use words with min this score in listen test
export const maxWordScore = 900; // only use words with max this score in listen test

@Injectable()
export class ReadnListenService {
  audioEnded = new Subject<boolean>();
  readAnotherBook = new Subject<Book>();

  constructor(
    private http: HttpClient
  ) {}

  /*** Audio ***/

  audioHasEnded(ended: boolean) {
    this.audioEnded.next(ended);
  }

  /*** Books ***/

  fetchPublishedBooks(readLanCode: string, sort: string): Observable<Book[]> {
    return this.http
    .get<Book[]>('/api/books/published/' + readLanCode + '/' + sort)
    .pipe(retry(3));
  }

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

  fetchUserBook(interfaceLanCode: string, bookId: string, isTest: boolean): Observable<UserBook> {
    return this.http
    .get<UserBook>('/api/book/user/' + interfaceLanCode + '/' + bookId + '/' + (isTest ? '1' : '0'))
    .pipe(retry(3));
  }

  startNewBook(book: Book) {
    this.readAnotherBook.next(book);
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

  placeBookmark(bookId: string, bookmark: Bookmark, lanCode: string, bookType: string, isTest: boolean): Observable<Bookmark> {
    return this.http
    .put<Bookmark>('/api/book/bookmark/', {bookmark, bookId, lanCode, bookType, isTest});
  }

  subscribeToBook(bookId: string, lanCode: string, bookType: string, isTest = false) {
    this.http
    .post<UserBook>('/api/book/subscribe', JSON.stringify({bookId, lanCode, bookType, isTest}))
    .toPromise();
  }

  unSubscribeFromBook(ubookId: string): Observable<UserBook> {
    return this.http
    .post<UserBook>('/api/book/unsubscribe', {ubookId});
  }

  recommendBook(ubookId: string, recommend: Boolean): Observable<UserBook> {
    return this.http
    .put<UserBook>('/api/book/recommend', {ubookId, recommend});
  }

  /*** Session Data ***/

  fetchSessionData(learnLanCode: string, bookType: string): Observable<UserData[]> {
    return this.http
    .get<UserData[]>('/api/book/sessions/' + learnLanCode + '/' + bookType)
    .pipe(retry(3));
  }

  saveSessionData(sessionData: SessionData): Observable<SessionData>  {
    console.log('saving session data', sessionData);
    if (sessionData._id) {
      // Update session data
      return this.http
      .put<SessionData>('/api/book/session', {sessionData});
    } else {
      // New session data
      return this.http
      .post<SessionData>('/api/book/session', {sessionData});
    }
  }

  fetchPreviousAnswers(bookId: string, userLanCode: string): Observable<string[]> {
    return this.http
    .get<string[]>('/api/book/sessions/book/' + bookId + '/' + userLanCode)
    .pipe(retry(3));
  }

  /*** Translations ***/

  fetchSentenceTranslations(
    userLanCode: string,
    bookId: string,
    sentence: string): Observable<SentenceTranslation[]> {
    return this.http
    .get<SentenceTranslation[]>('/api/book/translations/' + bookId + '/' + userLanCode + '/' + encodeURIComponent(sentence))
    .pipe(retry(3));
  }

  addSentenceTranslation(
    bookLanCode: string,
    userLanCode: string,
    bookId: string,
    sentence: string,
    translation: string,
    note: string): Observable<{translation: SentenceTranslation, translationsId: string}> {
    return this.http
    .post<{translation: SentenceTranslation, translationsId: string}>('/api/book/translation/', {
      bookLanCode, userLanCode, bookId, sentence, translation, note
    });
  }

  updateSentenceTranslation(
    translationId: string,
    translationElementId: string,
    translation: string,
    note: string): Observable<SentenceTranslation>  {
    return this.http
    .put<SentenceTranslation>('/api/book/translation', {
      translationId, translationElementId, translation, note
    });
  }

  fetchTranslationData(userLanCode: string, bookType: string): Observable<TranslationData[]> {
    // count the # of translations for all books into a specific language
    return this.http
    .get<TranslationData[]>('/api/book/translation/' + userLanCode);
  }

  /*** Thumbs ***/

  fetchThumbs(bookId: string, translationId: string): Observable<Thumbs[]> {
    return this.http
    .get<Thumbs[]>('/api/book/thumb/' + bookId + '/' + translationId)
    .pipe(retry(3));
  }

  saveThumb(
    up: boolean,
    bookId: string,
    translatorId: string,
    translationId: string,
    translationElementId: string
  ): Observable<boolean> {
    return this.http
    .post<boolean>('/api/book/thumb', {
      up,
      bookId,
      translatorId,
      translationId,
      translationElementId
    });
  }

  /*** Trophies ***/

  fetchSessionTrophies(): Observable<Trophy[]> {
    return this.http
    .get<Trophy[]>('/api/book/trophies/user')
    .pipe(retry(3));
  }

  fetchOverallSessionTrophies(existingTrophies: Trophy[]): Observable<string[]> {
    return this.http
    .post<string[]>('/api/book/trophies/session', {existingTrophies})
    .pipe(retry(3));
  }

  fetchOverallThumbTrophies(existingTrophies: Trophy[]): Observable<string[]> {
    return this.http
    .post<string[]>('/api/book/trophies/thumb', {existingTrophies})
    .pipe(retry(3));
  }

  saveTrophies(trophies: string[]): Observable<string[]> {
    return this.http
    .post<string[]>('/api/book/trophies', {trophies});
  }

  // https://gist.github.com/IceCreamYou/8396172
  getDamerauLevenshteinDistance(source: string, target: string): number {
    if (!source) {
      return target ? target.length : 0;
    } else if (!target) {
      return source.length;
    }

    const sourceLength = source.length,
          targetLength = target.length,
          INF = sourceLength + targetLength,
          score = new Array(sourceLength + 2),
          sd = {};
    let DB: number;

    for (let i = 0; i < sourceLength + 2; i++) {
      score[i] = new Array(targetLength + 2);
    }
    score[0][0] = INF;
    for (let i = 0; i <= sourceLength; i++) {
      score[i + 1][1] = i;
      score[i + 1][0] = INF;
      sd[source[i]] = 0;
    }
    for (let j = 0; j <= targetLength; j++) {
      score[1][j + 1] = j;
      score[0][j + 1] = INF;
      sd[target[j]] = 0;
    }
    for (let i = 1; i <= sourceLength; i++) {
      DB = 0;
      for (let j = 1; j <= targetLength; j++) {
        const i1 = sd[target[j - 1]],
              j1 = DB;
        if (source[i - 1] === target[j - 1]) {
          score[i + 1][j + 1] = score[i][j];
          DB = j;
        } else {
          score[i + 1][j + 1] = Math.min(score[i][j], Math.min(score[i + 1][j], score[i][j + 1])) + 1;
        }
        score[i + 1][j + 1] = Math.min(score[i + 1][j + 1], score[i1] ? score[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1) : Infinity);
      }
      sd[source[i - 1]] = i;
    }
    return score[sourceLength + 1][targetLength + 1];
  }

  // https://basarat.gitbooks.io/algorithms/content/docs/shuffling.html
  shuffle<T>(array: T[]): T[] {
    // if it's 1 or 0 items, just return
    if (!array || array.length <= 1) {
      return array;
    }
    // For each index in array
    for (let i = 0; i < array.length; i++) {
      // choose a random not-yet-placed item to place there
      // must be an item AFTER the current item, because the stuff
      // before has all already been placed
      const randomChoiceIndex = this.getRandom(i, array.length - 1);
      // place the random choice in the spot by swapping
      [array[i], array[randomChoiceIndex]] = [array[randomChoiceIndex], array[i]];
    }
    return array;
  }

  private getRandom(floor: number, ceiling: number) {
    return Math.floor(Math.random() * (ceiling - floor + 1)) + floor;
  }
}
