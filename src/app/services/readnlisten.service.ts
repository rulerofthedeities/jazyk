import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Book, Chapter, UserBook, UserData, TranslationData, Bookmark, UserBookActivity,
         SessionData, Thumbs, Trophy, AudioChapter } from '../models/book.model';
import { Word, SentenceWord, UserWord } from '../models/word.model';
import { Observable, Subject, of } from 'rxjs';
import { retry } from 'rxjs/operators';

export const minWordScore = 150; // only use words with min this score in listen test
export const maxWordScore = 950; // only use words with max this score in listen test

@Injectable()
export class ReadnListenService {
  readAnotherBook = new Subject<Book>();

  constructor(
    private http: HttpClient
  ) {}

  /*** Books ***/

  fetchPublishedTypeBooks(bookType: string, lanCode: string): Observable<Book[]> {
    return this.http
    .get<Book[]>(`/api/books/publishedtype/${bookType}/${lanCode}`)
    .pipe(retry(3));
  }

  fetchPublishedGlossaries(readLanCode: string, sort: string): Observable<Book[]> {
    return this.http
    .get<Book[]>('/api/wordlists/published/' + readLanCode + '/' + sort)
    .pipe(retry(3));
  }

  fetchBook(bookId: string, bookType: string): Observable<Book> {
    // gets published book only
    return this.http
    .get<Book>(`/api/books/book/${bookId}/${bookType}`)
    .pipe(retry(3));
  }

  fetchUserBook(userLanCode: string, bookId: string, bookType: string, isTest: boolean): Observable<UserBook> {
    return this.http
    .get<UserBook>('/api/book/user/' + userLanCode + '/' + bookId + '/' + bookType + '/' + (isTest ? '1' : '0'))
    .pipe(retry(3));
  }

  fetchAudioChapter(book: Book, sequence: number, isTest): Observable<AudioChapter> {
    return this.http
    .get<AudioChapter>(`/api/book/audiochapter/${book._id}/${sequence}/${isTest ? '1' : '0'}`)
    .pipe(retry(3));
  }

  startNewBook(book: Book) {
    this.readAnotherBook.next(book);
  }

  /*** Chapters ***/

  fetchChapter(bookId: string, sequence: number): Observable<Chapter> {
    return this.http
    .get<Chapter>(`/api/book/chapter/${bookId}/${sequence.toString()}`)
    .pipe(retry(3));
  }

  fetchChapterHeaders(bookId: string, bookType: string): Observable<Chapter[]> {
    const bookPath = bookType === 'listen' ? 'audiobook' : 'book';
    return this.http
    .get<Chapter[]>(`/api/${bookPath}/chapterheaders/${bookId}`)
    .pipe(retry(3));
  }

  /*** Words ***/

  fetchChapterWords(book: Book, sequence: number, userLanCode: string): Observable<Word[]> {
      return this.http
      .get<Word[]>(`/api/wordlist/words/${book._id}/${userLanCode}/${sequence}`)
      .pipe(retry(3));
  }

  fetchChapterUserWords(book: Book, sequence: number, userLanCode: string): Observable<UserWord[]> {
    return this.http
    .get<UserWord[]>(`/api/wordlist/userwords/${book._id}/${userLanCode}/${sequence}`)
    .pipe(retry(3));
  }

  fetchSentenceWords(book: Book, sequence: number): Observable<SentenceWord[]> {
    return this.http
    .get<SentenceWord[]>(`/api/wordlist/sentences/${book._id}/${sequence}`)
    .pipe(retry(3));
  }

  /*** Subscriptions ***/

  fetchUserBooks(targetLanCode: string, bookType: string): Observable<UserBook[]> {
    return this.http
    .get<UserBook[]>('/api/books/user/' + targetLanCode + '/' + bookType)
    .pipe(retry(3));
  }

  placeBookmark(bookId: string, bookmark: Bookmark, lanCode: string, bookType: string, isTest: boolean): Observable<Bookmark> {
    return this.http
    .put<Bookmark>('/api/book/bookmark/', {bookmark, bookId, lanCode, bookType, isTest});
  }

  subscribeToBook(bookId: string, lanCode: string, bookType: string, isTest: boolean): Observable<UserBook> {
    return this.http
    .post<UserBook>('/api/book/subscribe', {bookId, lanCode, bookType, isTest});
  }

  subscribeRepeat(bookId: string, lanCode: string, bookType: string, bookmark: Bookmark, isTest: boolean): Observable<UserBook> {
    return this.http
    .put<UserBook>('/api/book/subscribe/repeat', {bookId, lanCode, bookType, bookmark, isTest});
  }

  recommendBook(ubookId: string, recommend: Boolean): Observable<UserBook> {
    return this.http
    .put<UserBook>('/api/book/recommend', {ubookId, recommend});
  }

  setFinished(
    bookId: string,
    lanCode: string,
    bookType: string,
    isTest: boolean,
    finishedPoints: number
    ): Observable<UserBook> {
      return this.http
      .put<UserBook>('/api/book/finished', {bookId, lanCode, bookType, isTest, finishedPoints}
    );
  }

  /*** Session Data ***/

  saveSessionData(sessionData: SessionData): Observable<SessionData>  {
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

  saveSessionChangeAnswer(sessionData: SessionData): Observable<SessionData>  {
    // Answer after maybe
    return this.http
    .put<SessionData>('/api/book/sessionchange', {sessionData});
  }

  fetchPreviousAnswers(bookId: string, userLanCode: string, bookType: string): Observable<string[]> {
    return this.http
    .get<string[]>('/api/book/sessions/book/' + bookId + '/' + bookType + '/' + userLanCode)
    .pipe(retry(3));
  }

  fetchLatestSession(userLanCode: string, bookId: string, bookType: string, isTest: boolean): Observable<SessionData> {
    return this.http
    .get<SessionData>('/api/book/sessions/latest/' + bookId + '/' + bookType + '/' + userLanCode + '/' + (isTest ? '1' : '0'))
    .pipe(retry(3));
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
