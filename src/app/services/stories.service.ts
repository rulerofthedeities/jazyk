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

  fetchPublishedBooks(bookType: string, readLanCode: string, sort: string): Observable<Book[]> {
    return this.http
    .get<Book[]>(`/api/books/published/${bookType}/${readLanCode}/${sort}`)
    .pipe(retry(3));
  }

  fetchActivity(): Observable<UserBookActivity[]> {
    return this.http
    .get<UserBookActivity[]>('/api/stories/activity')
    .pipe(retry(3));
  }

  fetchUserBooks(targetLanCode: string): Observable<UserBookLean[]> {
    return this.http
    .get<UserBookLean[]>(`/api/stories/userbooks/${targetLanCode}`)
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

  fetchStoryWordTranslations(targetLanCode: string, bookId: string): Observable<UserWordCount> {
    return this.http
    .get<UserWordCount>(`/api/story/wordtranslations/${targetLanCode}/${bookId}`)
    .pipe(retry(3));
  }

  fetchStoryBookWords(bookId: string): Observable<UserWordCount> {
    return this.http
    .get<UserWordCount>(`/api/story/bookwords/count/${bookId}`)
    .pipe(retry(3));
  }

  fetchBookWordCount(readLanCode: string):  Observable<UserWordCount[]> {
    // get total count of book words per book
    return this.http
    .get<UserWordCount[]>(`/api/stories/bookwords/count/${readLanCode}`)
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

  unSubscribeFromBook(bookId: string, targetLanCode: string): Observable<boolean> {
    return this.http
    .post<boolean>('/api/book/unsubscribe', {bookId, targetLanCode});
  }

  subscribeToBook(bookId: string, lanCode: string, bookType: string, isTest: boolean): Observable<UserBook> {
    return this.http
    .post<UserBook>('/api/book/subscribe', {bookId, lanCode, bookType, isTest});
  }

  recommendBook(ubookId: string): Observable<boolean> {
    return this.http
    .put<boolean>('/api/book/recommend', {ubookId, recommend: true});
  }

  unRecommendBook(bookId: string, targetLanCode: string): Observable<boolean> {
    return this.http
    .put<boolean>('/api/book/unrecommend', {bookId, targetLanCode});
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

  searchBooks(bookLanCode: string, search: string): Observable<Book[]> {
    const query = encodeURI(search);
    return this.http
    .get<Book[]>(`/api/books/search/${bookLanCode}/${query}`)
    .pipe(retry(3));
  }

  resetBookStatus(): UserBookStatus {
    return {
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
    userWordData: UserWordData
  ): UserData {
    let userData: UserData;
    if (userWordData) {
      if (!userGlossaryCount) { // Clicked on tab, data not available from parent component
        userGlossaryCount = {
          countTotal: userWordData.pinned || 0,
          countTranslation: userWordData.translated || 0
        };
      }
      const glossaryType = userBook && userBook.bookmark ? userBook.bookmark.lastGlossaryType : 'all',
            yes = glossaryType === 'my' ? (userWordData.lastAnswerMyYes || 0) : (userWordData.lastAnswerAllYes || 0),
            no = glossaryType === 'my' ? (userWordData.lastAnswerMyNo || 0) : (userWordData.lastAnswerAllNo || 0),
            words = yes + no,
            totalWords = book.nrOfWordsInList,
            totalWordTranslated = glossaryType === 'my' ?
                                  userGlossaryCount.countTranslation :
                                  (glossaryCount ? glossaryCount.countTranslation : 0);
      if (words > 0) {
        status.isStarted = true;
      }
      // pie chart
     userData = {
        bookId: book._id,
        isTest: false,
        nrSentencesDone: yes + no,
        nrYes: yes,
        nrNo: no,
        nrMaybe: 0,
        repeatCount: 0
      };
      // progress bar
      status.nrOfSentencesDone = words > totalWordTranslated ? totalWordTranslated : words;
      status.percDone = this.sharedService.getPercentage(words, totalWordTranslated);
      status.nrOfSentences = totalWordTranslated;
      status.isBookRead = !!(words >= totalWordTranslated);
      if (userBook) {
        status.isRepeat = !!(userBook.repeatCount > 0);
      }
    }
    return userData;
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
