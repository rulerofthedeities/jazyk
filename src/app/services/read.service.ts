import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Book, Chapter, SentenceTranslation, TranslationData,
         UserBook, Bookmark, SessionData, UserData, Thumbs, Trophy } from '../models/book.model';
import { Observable, Subject } from 'rxjs';
import { retry } from 'rxjs/operators';

@Injectable()
export class ReadService {
  readAnotherBook = new Subject<Book>();

  constructor(
    private http: HttpClient
  ) {}

  startNewBook(book: Book) {
    this.readAnotherBook.next(book);
  }

  /*** Books ***/

  fetchPublishedBooks(learnLanCode: string, sort: string): Observable<Book[]> {
    return this.http
    .get<Book[]>('/api/books/published/' + learnLanCode + '/' + sort)
    .pipe(retry(3));
  }

  fetchUserBooks(interfaceLanCode: string): Observable<UserBook[]> {
    return this.http
    .get<UserBook[]>('/api/books/user/' + interfaceLanCode)
    .pipe(retry(3));
  }

  fetchUserBook(interfaceLanCode: string, bookId: string): Observable<UserBook> {
    return this.http
    .get<UserBook>('/api/book/user/' + interfaceLanCode + '/' + bookId)
    .pipe(retry(3));
  }

  fetchBook(bookId: string): Observable<Book> {
    // gets published book only
    return this.http
    .get<Book>('/api/book/' + bookId)
    .pipe(retry(3));
  }

  placeBookmark(bookId: string, bookmark: Bookmark, lanCode: string): Observable<Bookmark> {
    return this.http
    .put<Bookmark>('/api/book/bookmark/' + bookId + '/' + lanCode, {bookmark});
  }

  /*** Chapters ***/

  fetchChapter(bookId: string, chapterId: string, sequence: number): Observable<Chapter> {
    const chapter = chapterId ? chapterId : '0';
    return this.http
    .get<Chapter>('/api/book/chapter/' + bookId + '/' + chapter + '/' + sequence.toString())
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

  fetchTranslationData(userLanCode: string): Observable<TranslationData[]> {
    // count the # of translations for all books into a specific language
    return this.http
    .get<TranslationData[]>('/api/book/translation/' + userLanCode);
  }

  /*** Session data ***/

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

  fetchSessionData(learnLanCode: string): Observable<UserData[]> {
    return this.http
    .get<UserData[]>('/api/book/sessions/' + learnLanCode)
    .pipe(retry(3));
  }

  fetchPreviousAnswers(bookId: string, userLanCode: string): Observable<string[]> {
    return this.http
    .get<string[]>('/api/book/sessions/book/' + bookId + '/' + userLanCode)
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
