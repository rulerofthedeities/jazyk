import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SharedService } from '../services/shared.service';
import { Book, BookCount, UserBookActivity, UserBookLean, UserData, TranslationData,
        FinishedData, UserBook, UserBookStatus } from '../models/book.model';
import { UserWordCount, UserWordData } from '../models/word.model';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';

@Injectable()
export class StoriesService {

  constructor(
    private http: HttpClient,
    private sharedService: SharedService
  ) {}

  fetchBooksCount(bookType: string): Observable<BookCount[]> {
    return this.http
    .get<BookCount[]>(`/api/books/count/${bookType}`)
    .pipe(retry(3));
  }

  fetchPublishedBooks(readLanCode: string, sort: string): Observable<Book[]> {
    return this.http
    .get<Book[]>('/api/books/published/' + readLanCode + '/' + sort)
    .pipe(retry(3));
  }

  fetchActivity(): Observable<UserBookActivity[]> {
    return this.http
    .get<UserBookActivity[]>('/api/stories/activity')
    .pipe(retry(3));
  }

  fetchUserBooks(targetLanCode: string, bookType: string): Observable<UserBookLean[]> {
    return this.http
    .get<UserBookLean[]>('/api/stories/userbooks/' + targetLanCode + '/' + bookType)
    .pipe(retry(3));
  }

  fetchStoryUserBooks(targetLanCode: string, bookType: string, bookId: string): Observable<UserBookLean[]> {
    return this.http
    .get<UserBookLean[]>(`/api/story/user/${targetLanCode}/${bookType}/${bookId}`)
    .pipe(retry(3));
  }

  fetchUserWords(targetLanCode: string): Observable<UserWordData[]> {
    return this.http
    .get<UserWordData[]>(`/api/stories/userwords/${targetLanCode}`)
    .pipe(retry(3));
  }

  fetchStoryUserWords(targetLanCode: string, bookId: string): Observable<UserWordData> {
    return this.http
    .get<UserWordData>(`/api/story/userwords/${targetLanCode}/${bookId}`)
    .pipe(retry(3));
  }

  fetchStoryBookWords(targetLanCode: string, bookId: string): Observable<UserWordCount> {
    return this.http
    .get<UserWordCount>(`/api/story/bookwords/${targetLanCode}/${bookId}`)
    .pipe(retry(3));
  }

  fetchSessionData(targetLanCode: string, bookType: string): Observable<UserData[]> {
    return this.http
    .get<UserData[]>(`/api/stories/sessions/${targetLanCode}/${bookType}`)
    .pipe(retry(3));
  }

  fetchStorySessionData(targetLanCode: string, bookType: string, bookId: string): Observable<UserData[]> {
    return this.http
    .get<UserData[]>(`/api/story/sessions/${targetLanCode}/${bookType}/${bookId}`)
    .pipe(retry(3));
  }

  fetchTranslationData(targetLanCode: string): Observable<TranslationData[]> {
    // count the # of translations for all books into a specific language
    return this.http
    .get<TranslationData[]>('/api/stories/translation/' + targetLanCode);
  }

  fetchStoryTranslationData(targetLanCode: string, bookId: string): Observable<TranslationData> {
    return this.http
    .get<TranslationData>(`/api/story/translation/${targetLanCode}/${bookId}`);
  }

  fetchFinishedData(targetLanCode: string): Observable<FinishedData[]> {
    // check which tabs are finished
    return this.http
    .get<FinishedData[]>('/api/stories/finished/' + targetLanCode);
  }

  unSubscribeFromBook(ubookId: string): Observable<UserBook> {
    return this.http
    .post<UserBook>('/api/book/unsubscribe', {ubookId});
  }

  subscribeToBook(bookId: string, lanCode: string, bookType: string, isTest: boolean): Observable<UserBook> {
    return this.http
    .post<UserBook>('/api/book/subscribe', {bookId, lanCode, bookType, isTest});
  }

  recommendBook(ubookId: string, recommend: Boolean): Observable<UserBook> {
    return this.http
    .put<UserBook>('/api/book/recommend', {ubookId, recommend});
  }

  fetchUserWordCounts(bookLanCode: string, targetLanCode: string): Observable<UserWordCount[]> {
    return this.http
    .get<UserWordCount[]>(`/api/userwordlists/count/${bookLanCode}/${targetLanCode}`)
    .pipe(retry(3));
  }

  fetchBookWordCounts(bookLanCode: string, targetLanCode: string): Observable<UserWordCount[]> {
    return this.http
    .get<UserWordCount[]>(`/api/bookwordlists/count/${bookLanCode}/${targetLanCode}`)
    .pipe(retry(3));
  }

  resetBookStatus(): UserBookStatus {
    return {
      isSubscribed: false,
      isRecommended: false,
      isStarted: false,
      isBookRead: false,
      isRepeat: false,
      nrOfSentencesDone: 0,
      nrOfSentences: 0,
      percDone: 0
    };
  }

  initBookStatus(book: Book, status: UserBookStatus, userBook: UserBookLean) {
    if (userBook) {
      status.isSubscribed = !!userBook.subscribed;
      status.isRecommended = !!userBook.recommended;
      status.isRepeat = userBook.repeatCount > 0;
      if (userBook.bookmark && userBook.bookmark.chapterId) {
        status.isStarted = true;
        if (userBook.bookmark.isBookRead) {
          status.nrOfSentencesDone = book.difficulty.nrOfSentences;
          status.isBookRead = true;
          status.percDone = 100;
          status.isStarted = false;
        }
      }
    }
  }

  hasFlashCards(glossaryCount: UserWordCount, userGlossaryCount: UserWordCount): boolean {
    return ((glossaryCount && glossaryCount.countTranslation > 0) ||
            (userGlossaryCount && userGlossaryCount.countTranslation > 0));
  }

  checkGlossaryStatus(
    book: Book,
    glossaryCount: UserWordCount,
    userGlossaryCount: UserWordCount,
    status: UserBookStatus,
    userBook: UserBookLean,
    userData: UserWordData
  ) {
    if (userData) {
      if (!userGlossaryCount) { // Clicked on tab, data not available from parent component
        userGlossaryCount = {
          countTotal: userData.pinned || 0,
          countTranslation: userData.translated || 0
        };
      }
      const yes = userData.lastAnswerNo || 0,
            no = userData.lastAnswerYes || 0,
            words = yes + no,
            glossaryType = userBook.bookmark ? userBook.bookmark.lastGlossaryType : 'all',
            totalWords = book.nrOfWordsInList,
            totalWordTranslated = glossaryType === 'all' ? glossaryCount.countTranslation : userGlossaryCount.countTranslation;
            console.log('GLOSSARY STATUS', glossaryCount, userGlossaryCount);
      console.log('GLOSSARY TYPE', glossaryType);
      if (words > 0) {
        status.isStarted = true;
      }
      console.log('WORDS', book.title, words, totalWordTranslated);
      status.nrOfSentencesDone = words > totalWordTranslated ? totalWordTranslated : words;
      status.percDone = this.sharedService.getPercentage(words, totalWordTranslated);
      status.nrOfSentences = totalWordTranslated;
      status.isBookRead = !!(words >= totalWordTranslated);
      if (userBook) {
        status.isSubscribed = !!userBook.subscribed;
        status.isRecommended = !!userBook.recommended;
        status.isRepeat = !!(userBook.repeatCount > 0);
      }
      console.log('WORD TRANSLATION COUNT', book.title, userGlossaryCount, userData.translated);
    }
  }

  checkSentencesDone(book: Book, userData: UserData, status: UserBookStatus) {
    if (userData) {
      if (userData.nrSentencesDone > 0) {
        status.nrOfSentencesDone = userData.nrSentencesDone;
        status.nrOfSentences = book.difficulty.nrOfSentences;
        status.percDone = this.sharedService.getPercentage(status.nrOfSentencesDone, book.difficulty.nrOfSentences);
      }
    }
  }

  getCurrentUserData(userData: UserData[]): UserData {
    // Use the most recent repeat for current user data
    if (userData && userData.length) {
      if (userData.length > 1) {
        userData.map(data => data.repeatCount = data.repeatCount || 0);
        userData.sort(
          (a, b) => (a.repeatCount > b.repeatCount) ? -1 : ((b.repeatCount > a.repeatCount) ? 1 : 0)
        );
      }
      return userData[0];
    } else {
      return null;
    }
  }
}
