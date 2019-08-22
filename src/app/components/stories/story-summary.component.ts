import { Component, Input, Output, ViewChild, OnInit, OnDestroy, EventEmitter,
         Renderer2, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService, awsPath } from '../../services/shared.service';
import { StoriesService } from 'app/services/stories.service';
import { UserService } from '../../services/user.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { PlatformService } from '../../services/platform.service';
import { LicenseUrl } from '../../models/main.model';
import { Book, UserBookActivity, UserBookLean, UserDataLean, FinishedTab, TranslationData } from 'app/models/book.model';
import { UserWordCount, UserWordData } from '../../models/word.model';
import { takeWhile, delay } from 'rxjs/operators';
import { zip, of, Subject } from 'rxjs';

interface UserBookStatus {
  isSubscribed: boolean;
  isRecommended: boolean;
  isStarted: boolean;
  isRepeat: boolean;
  nrOfSentencesDone: number;
  nrOfSentences: number;
  isBookRead: boolean;
  percDone: number;
}

interface ColorHistory {
  red: string;
  orange: string;
  green: string;
}

@Component({
  selector: 'km-story-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'story.summary.component.html',
  styleUrls: ['story.summary.component.css']
})

export class StorySummaryComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  @Input() tab: string;
  @Input() book: Book;
  @Input() nr: number;
  @Input() total: number;
  @Input() targetLanCode: string;
  @Input() licenses: LicenseUrl[];
  @Input() private activity: UserBookActivity;
  @Input() finishedTabs: FinishedTab;
  @Input() private userBook: UserBookLean;
  @Input() private userBookTest: UserBookLean;
  @Input() private userData: UserDataLean[];
  @Input() private userDataTest: UserDataLean[];
  @Input() userGlossaryCount: UserWordCount;
  @Input() userGlossaryData: UserWordData;
  @Input() glossaryCount: UserWordCount;
  @Input() translationCount: number;
  @Input() isMyList: boolean;
  @Input() private dataLoaded: Subject<boolean>;
  @Output() removedSubscription = new EventEmitter<Book>();
  @Output() addedSubscription = new EventEmitter<Book>();
  @ViewChild('flashcardDropdown') flashcardDropdown: ElementRef;
  private componentActive = true;
  userBookStatus: UserBookStatus;
  userBookStatusTest: UserBookStatus;
  isFinished = false;
  showCompact = true;
  tabChanged = false;
  isNewBook = false;
  isLoading = true;
  userCount = 0;
  recommendCount = 0;
  popularity = 0;
  coverImage: string;
  hasImage: boolean;
  audioTitle: string;
  hasAudioTitle: boolean;
  hasFlashCards: boolean;
  showFlashCardDropdown = false;
  showIntro = false;
  showCredits = false;
  isTranslated = false;
  hasTest = false;
  currentUserData: UserDataLean;
  currentUserTestData: UserDataLean;
  currentUserBook: UserBookLean;
  currentUserBookTest: UserBookLean;
  currentGlossaryCount: UserWordCount;
  translationString: string;
  difficultyWidth: number;
  difficultyPerc: number;
  showHistoryData: boolean[] = [false, false];
  userColors: ColorHistory[][] = [];
  currentTab: string;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private platform: PlatformService,
    private sharedService: SharedService,
    private storiesService: StoriesService,
    private userService: UserService,
    private readnListenService: ReadnListenService,
    renderer: Renderer2
  ) {
    if (this.platform.isBrowser) {
      renderer.listen(document, 'click', (event) => {
        if (this.flashcardDropdown && !this.flashcardDropdown.nativeElement.contains(event.target)) {
          // Outside flashcard dropdown, close dropdown
          this.showFlashCardDropdown = false;
        }
      });
    }
  }

  ngOnInit() {
    this.currentTab = this.tab;
    this.observe();
    this.setCoverImage();
    this.setAudioFile();
    this.setActivity();
    this.checkIfNew();
    this.setDifficulty();
  }

  onAudioEnded(isEnded: boolean) {
    this.sharedService.audioHasEnded(isEnded);
  }

  onToggleIntro() {
    this.showIntro = !this.showIntro;
    if (this.showIntro) {
      this.showCredits = false;
    }
  }

  onToggleCredits() {
    this.showCredits = !this.showCredits;
    if (this.showCredits) {
      this.showIntro = false;
    }
  }

  onSelectTab(newTab: string) {
    if (newTab !== this.tab) {
      this.tab = newTab;
      this.tabChanged = true;
      this.setTab();
      this.resetStatus();
      this.getNewTypeData();
    }
  }

  onToggleSubscription(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if ((this.userBookStatus && !this.userBookStatus.isSubscribed) || !this.userBookStatus) {
      this.storiesService
      .subscribeToBook(this.book._id, this.targetLanCode, this.tab, false)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        userBook => {
          if (userBook && userBook.subscribed) {
            this.userBookStatus.isSubscribed = true;
            this.addedSubscription.emit(this.book);
          }
        }
      );
    } else {
      this.unsubscribe();
    }
  }

  onToggleRecommend(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.userBookStatus && (this.userBookStatus.isBookRead || this.userBookStatus.isRepeat)) {
      this.saveRecommend();
    }
  }

  onShowRepeatHistory(isTest: boolean) {
    const historyNr = isTest ? 1 : 0,
          userData = isTest ? this.userDataTest : this.userData;
    if (!this.showHistoryData[historyNr]) {
      this.userColors[historyNr] = [];
      let total: number,
          red: number,
          orange: number,
          green: number;
      userData.forEach(data => {
        total = data.nrNo + data.nrMaybe + data.nrYes;
        red = Math.round(data.nrNo / total * 100);
        orange = Math.round(data.nrMaybe / total * 100);
        green = 100 - red - orange;
        this.userColors[historyNr].push({
          red: red.toString(),
          orange: orange.toString(),
          green: green.toString()
        });
      });
    }
    this.showHistoryData[historyNr] = !this.showHistoryData[historyNr];
  }

  onStartReadingListening(isRepeat = false, isTest = false, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.userService.setLanCode(this.book.lanCode);
    this.userService.setUserLanCode(this.targetLanCode);
    if (isRepeat) {
      this.readnListenService
      .subscribeRepeat(this.book._id, this.targetLanCode, this.tab, this.userBook.bookmark, isTest)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(subscription => {
        this.startReadingListening(this.book._id, this.targetLanCode, this.tab, isTest);
      });
    } else {
      this.readnListenService
      .subscribeToBook(this.book._id, this.targetLanCode, this.tab, isTest)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(subscription => {
        this.startReadingListening(this.book._id, this.targetLanCode, this.tab, isTest);
      });
    }
  }

  onStartListeningTest() {
    this.userService.setLanCode(this.book.lanCode);
    this.userService.setUserLanCode(this.targetLanCode);
    this.readnListenService
    .subscribeToBook(this.book._id, this.targetLanCode, 'listen', true)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(subscription => {
      this.startReadingListening(this.book._id, this.targetLanCode, this.tab, true);
    });
  }

  onStartVocabularyTest() {
    // console.log('start vocabulary test');
  }

  onWordList() {
    this.router.navigate([`/glossaries/glossary/${this.book._id}/${this.targetLanCode}`]);
  }

  onToggleFlashCardDropdown() {
    this.showFlashCardDropdown = !this.showFlashCardDropdown;
  }

  onStartFlashcards(tpe: string, count: number) {
    if (count > 0) {
      this.log(`Start flash cards for '${this.book.title}'`);
      this.router.navigate([`/glossaries/glossary/flashcards/${this.book._id}/${this.targetLanCode}/${tpe}`]);
    }
  }

  onRevision() {
    this.log(`Start revision for '${this.book.title}'`);
    this.router.navigate([`/read/book/${this.book._id}/${this.targetLanCode}/review`]);
  }

  onStopReadingListening() {
    this.unsubscribe();
  }

  onOpen(event: MouseEvent) {
    event.preventDefault();
    if (this.showCompact) {
      this.showCompact = false;
    }
  }

  private processAsyncData() {
    if (!this.userBookStatus || !this.userBookStatusTest) {
      this.resetStatus();
    }
    if (this.tab !== this.currentTab) {
      this.setTab();
      // clear current data
      this.currentUserData = null;
      this.currentUserTestData = null;
      this.currentUserBook = null;
      this.currentUserBookTest = null;
      this.currentGlossaryCount = null;
      this.translationString = undefined;
      this.hasFlashCards = undefined;
    }
    this.processAllCurrentUserData();
    this.checkStatus();
    this.currentUserBook = this.userBook;
    this.currentUserBookTest = this.userBookTest;
    this.processGlossaryData(this.userGlossaryData, this.glossaryCount);
    this.checkTranslated();
    this.isLoading = false;
  }

  private setTab() {
    this.currentTab = this.tab;
    this.hasTest = this.tab === 'listen' ? true : false;
  }

  private startReadingListening(bookId: string, targetLanCode: string, bookType: string, isTest: boolean) {
    if (isTest) {
      this.log(`Start listening test for '${this.book.title}'`);
      this.router.navigate([`/listen/book/${bookId}/${targetLanCode}/test`]);
    } else {
      if (bookType === 'listen') {
        this.log(`Start listening to '${this.book.title}'`);
        this.router.navigate([`/listen/book/${bookId}/${targetLanCode}`]);
      } else {
        this.log(`Start reading '${this.book.title}'`);
        this.router.navigate([`/read/book/${bookId}/${targetLanCode}`]);
      }
    }
  }

  private getNewTypeData() {
    // Reload type data
    // glossary: userbooks + userWords + bookWords
    // listen+read: userbooks & usersessions + translations
    this.isLoading = true;
    if (this.tab !== 'glossary') {
      zip(
        this.storiesService.fetchStoryUserBooks(this.targetLanCode, this.tab, this.book._id),
        this.storiesService.fetchStorySessionData(this.targetLanCode, this.tab, this.book._id),
        this.translationString === undefined ?
          this.storiesService.fetchStoryTranslationData(this.targetLanCode, this.book._id) : of({count: null, bookId: 'none'})
      )
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(data => {
        if (data && data.length) {
          this.processUserBooks(data[0]);
          this.processSessionData(data[1]);
          this.processTranslationData(data[2]);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    } else {
      zip(
        this.storiesService.fetchStoryUserBooks(this.targetLanCode, this.tab, this.book._id),
        this.storiesService.fetchStoryUserWords(this.targetLanCode, this.book._id),
        this.storiesService.fetchStoryBookWords(this.targetLanCode, this.book._id) // For translation count
      )
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(data => {
        if (data && data.length) {
          this.processUserBooks(data[0]);
          this.processGlossaryData(data[1], data[2]);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  private processUserBooks(uBooks: UserBookLean[]) {
    this.userBook = null;
    this.userBookTest = null;
    uBooks.forEach(uBook => {
      if (uBook.isTest) {
        this.userBookTest = uBook;
      } else {
        this.userBook = uBook;
      }
      delete uBook.bookId;
    });
    this.checkStatus();
  }

  private processSessionData(sessionData: UserDataLean[]) {
    this.userData = [];
    this.userDataTest = [];
    sessionData.forEach(session => {
      if (session.isTest) {
        this.userDataTest = this.userDataTest ? this.userDataTest : [];
        this.userDataTest.push(session);
      } else {
        this.userData = this.userData ? this.userData : [];
        this.userData.push(session);
      }
      delete session.bookId;
    });
    this.processAllCurrentUserData();
  }

  private processTranslationData(translations: TranslationData) {
    if (translations.bookId !== 'none') {
      this.translationCount = translations.count;
      this.checkTranslated();
    }
  }

  private setCoverImage() {
    const defaultImage = '/assets/img/books/blankcover.png';
    this.hasImage = !!this.book.coverImg;
    if (this.hasImage) {
      this.coverImage = `https://${awsPath}books/covers/${this.book.lanCode}/${this.book.coverImg}`;
    } else {
      this.coverImage = defaultImage;
    }
  }

  private setAudioFile() {
    if (this.book.audioTitle && this.book.audioTitle.s3 && this.book.audioTitle.hasMp3) {
      this.hasAudioTitle = true;
      this.audioTitle = `https://${awsPath}audiobooks/${this.book.lanCode}/${this.book.audioDirectory}/${this.book.audioTitle.s3}`;
    } else {
      this.hasAudioTitle = false;
    }
  }

  private checkIfNew() {
    let published = null;
    if (this.book.dt) {
      switch (this.tab) {
        case 'read':
            published = this.book.dt.published;
          break;
        case 'listen':
            published = this.book.dt.publishedAudio;
          break;
        case 'glossary':
            published = this.book.dt.publishedGlossary;
          break;
      }
    }
    if (published) {
      const oneDay = 24 * 60 * 60 * 1000, // hours * minutes * seconds * milliseconds
            dtPublished = new Date(published),
            dtNow = new Date(),
            diffInDays = Math.round(Math.abs((dtNow.getTime() - dtPublished.getTime()) / (oneDay)));
      if (diffInDays < 14) {
        this.isNewBook = true;
      }
    }
  }

  private resetStatus() {
    this.userBookStatus = this.resetBook();
    this.userBookStatusTest = this.resetBook();
  }

  private checkStatus() {
    this.initBook(this.userBookStatus, this.userBook);
    this.initBook(this.userBookStatusTest, this.userBookTest);
    this.checkCompact();
  }

  private initBook(status: UserBookStatus, userBook: UserBookLean) {
    if (userBook) {
      status.isSubscribed = !!userBook.subscribed;
      status.isRecommended = !!userBook.recommended;
      status.isRepeat = userBook.repeatCount > 0;
      if (userBook.bookmark && userBook.bookmark.chapterId) {
        status.isStarted = true;
        if (userBook.bookmark.isBookRead) {
          status.nrOfSentencesDone = this.book.difficulty.nrOfSentences;
          status.isBookRead = true;
          status.percDone = 100;
          status.isStarted = false;
        }
      }
    }
  }

  private checkGlossaryStatus(status: UserBookStatus, userBook: UserBookLean, userData: UserWordData) {
    if (userData) {
      const yes = userData.lastAnswerNo || 0,
            no = userData.lastAnswerYes || 0,
            words = yes + no,
            totalWords = this.book.nrOfWordsInList,
            totalWordTranslated = this.glossaryCount.countTranslation;
      if (words > 0) {
        status.isStarted = true;
      }
      status.nrOfSentencesDone = words;
      status.percDone = this.sharedService.getPercentage(words, totalWordTranslated);
      status.nrOfSentences = totalWordTranslated;
      status.isBookRead = !!(words >= totalWordTranslated);
      if (userBook) {
        status.isSubscribed = !!userBook.subscribed;
        status.isRecommended = !!userBook.recommended;
        status.isRepeat = !!(userBook.repeatCount > 0);
      }
      if (!this.userGlossaryCount) { // Clicked on tab, data not available from parent component
        this.userGlossaryCount = {
          countTotal: userData.pinned || 0,
          countTranslation: userData.translated || 0
        };
      }
    }
    this.checkCompact();
  }

  private checkSentencesDone() {
    this.checkSentencesDoneEach(this.currentUserData, this.userBookStatus);
    this.checkSentencesDoneEach(this.currentUserTestData, this.userBookStatusTest);
  }

  private checkSentencesDoneEach(userData: UserDataLean, status: UserBookStatus) {
    if (userData) {
      if (userData.nrSentencesDone > 0) {
        status.nrOfSentencesDone = userData.nrSentencesDone;
        status.nrOfSentences = this.book.difficulty.nrOfSentences;
        status.percDone = this.sharedService.getPercentage(status.nrOfSentencesDone, this.book.difficulty.nrOfSentences);
      }
    }
  }

  private checkCompact() {
    if (this.finishedTabs && this.finishedTabs[this.tab]) {
      this.isFinished = true;
    } else {
      this.isFinished = false;
    }
    if (!this.tabChanged) {
      // only show compact format initially, not when a tab is clicked
      if (this.isFinished && this.userBookStatus && !this.userBookStatus.isStarted) {
        this.showCompact = true;
      } else {
        this.showCompact = false;
      }
    }
  }

  private checkTranslated() {
    if (this.translationCount > 0) {
      const unique = this.book.difficulty ? this.book.difficulty.nrOfUniqueSentences || 0 : 0,
            maxTranslated = this.translationCount > unique ? unique : this.translationCount;
      this.translationString = `${maxTranslated} / ${unique}`;
      this.isTranslated = maxTranslated >= unique;
    } else {
      this.isTranslated = false;
      this.translationString = '';
    }
  }

  private checkHasFlashCards() {
    this.hasFlashCards = false;
    console.log('glossarycount', this.glossaryCount, this.userGlossaryCount);
    if ((this.glossaryCount && this.glossaryCount.countTranslation > 0) ||
        (this.userGlossaryCount && this.userGlossaryCount.countTranslation > 0)) {
      this.hasFlashCards = true;
    }
  }

  private resetBook(): UserBookStatus {
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

  private setActivity() {
    if (this.activity) {
      this.userCount = this.activity.started;
      this.recommendCount = this.userCount > 0 ? this.activity.recommended : 0;
      this.popularity = this.activity.popularity;
    }
  }

  private setDifficulty() {
    const difficulty = this.sharedService.getBookDifficulty(this.book);
    this.difficultyWidth = difficulty.difficultyWidth;
    this.difficultyPerc = difficulty.difficultyPerc;
  }

  private processAllCurrentUserData() {
    // Use the most recent repeat for current user data
    this.currentUserData = this.getCurrentUserData(this.userData);
    this.currentUserTestData = this.getCurrentUserData(this.userDataTest);
    this.checkSentencesDone();
  }

  private getCurrentUserData(userData: UserDataLean[]): UserDataLean {
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

  private processGlossaryData(glossaryData: UserWordData, translationCount: UserWordCount) {
    this.glossaryCount = translationCount;
    this.currentGlossaryCount = this.glossaryCount;
    this.checkHasFlashCards();
    this.checkGlossaryStatus(this.userBookStatus, this.userBook, glossaryData);
  }

  private unsubscribe() {
    // Unsubscribe from test and non-test
    if (this.userBook && this.userBookStatus && this.userBookStatus.isSubscribed) {
      this.storiesService
      .unSubscribeFromBook(this.userBook._id)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        userBook => {
          if (userBook && !userBook.subscribed) {
            this.userBookStatus.isSubscribed = false;
            this.removedSubscription.emit(this.book);
          }
        }
      );
    }
    if (this.userBookTest && this.userBookStatusTest && this.userBookStatusTest.isSubscribed) {
      this.storiesService
      .unSubscribeFromBook(this.userBookTest._id)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        userBook => {
          if (userBook && !userBook.subscribed) {
            this.userBookStatusTest.isSubscribed = false;
            this.removedSubscription.emit(this.book);
          }
        }
      );
    }
  }

  private saveRecommend() {
    this.storiesService
    .recommendBook(this.userBook._id, !this.userBookStatus.isRecommended)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      updated => {
        this.userBookStatus.isRecommended = !this.userBookStatus.isRecommended;
        this.userBook.recommended = this.userBookStatus.isRecommended;
        this.activity.recommended += this.userBookStatus.isRecommended ? 1 : -1;
        this.activity.recommended = this.activity.recommended < 0 ? 0 : this.activity.recommended;
        this.recommendCount = this.activity.recommended;
      }
    );
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'StorySummaryComponent'
    });
  }

  private observe() {
    this.dataLoaded
    .pipe(takeWhile( () => this.componentActive))
    .subscribe(loaded => {
      console.log('DATA LOADED', this.book.title, loaded);
      if (loaded) {
        this.processAsyncData();
      }
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
