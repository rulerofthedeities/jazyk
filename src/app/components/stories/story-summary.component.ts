import { Component, Input, Output, OnInit, OnDestroy, EventEmitter,
         ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { StoriesService } from 'app/services/stories.service';
import { LicenseUrl } from '../../models/main.model';
import { Book, UserBookActivity, UserBookLean, UserBookStatus, UserData,
         FinishedTab, TranslationData } from 'app/models/book.model';
import { UserWordCount, UserWordData } from '../../models/word.model';
import { takeWhile, delay } from 'rxjs/operators';
import { zip, of, Subject } from 'rxjs';

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
  @Input() userBook: UserBookLean;
  @Input() userBookTest: UserBookLean;
  @Input() private userData: UserData[];
  @Input() private userDataTest: UserData[];
  @Input() userGlossaryCount: UserWordCount;
  @Input() userGlossaryData: UserWordData;
  @Input() glossaryCount: UserWordCount;
  @Input() translationCount: number;
  @Input() isMyList: boolean;
  @Input() private dataLoaded: Subject<boolean>;
  @Output() removedSubscription = new EventEmitter<Book>();
  @Output() addedSubscription = new EventEmitter<Book>();
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
  isTranslated = false;
  hasTest = false;
  currentUserData: UserData;
  currentUserTestData: UserData;
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
    private cdr: ChangeDetectorRef,
    private sharedService: SharedService,
    private storiesService: StoriesService
  ) {}

  ngOnInit() {
    this.currentTab = this.tab;
    this.setTab();
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
        this.sharedService.detectChanges(this.cdr);
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
        this.sharedService.detectChanges(this.cdr);
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

  private processSessionData(sessionData: UserData[]) {
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
    this.hasImage = !!this.book.coverImg;
    this.coverImage = this.sharedService.getCoverImagePath(this.book);
  }

  private setAudioFile() {
    if (this.book.audioTitle && this.book.audioTitle.s3 && this.book.audioTitle.hasMp3) {
      this.hasAudioTitle = true;
      this.audioTitle = this.sharedService.getAudioTitle(this.book);
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
    this.userBookStatus = this.storiesService.resetBookStatus();
    this.userBookStatusTest = this.storiesService.resetBookStatus();
  }

  private checkStatus() {
    this.storiesService.initBookStatus(this.book, this.userBookStatus, this.userBook);
    this.storiesService.initBookStatus(this.book, this.userBookStatusTest, this.userBookTest);
    this.checkCompact();
  }

  private checkCompact() {
    console.log('checking compact');
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
    this.currentUserData = this.storiesService.getCurrentUserData(this.userData);
    this.currentUserTestData = this.storiesService.getCurrentUserData(this.userDataTest);
    this.checkSentencesDone();
  }

  private checkSentencesDone() {
    this.storiesService.checkSentencesDone(this.book, this.currentUserData, this.userBookStatus);
    this.storiesService.checkSentencesDone(this.book, this.currentUserTestData, this.userBookStatusTest);
  }

  private processGlossaryData(glossaryData: UserWordData, translationCount: UserWordCount) {
    this.glossaryCount = translationCount;
    this.currentGlossaryCount = this.glossaryCount;
    this.hasFlashCards = this.storiesService.hasFlashCards(this.glossaryCount, this.userGlossaryCount);
    this.storiesService.checkGlossaryStatus(
      this.book,
      this.glossaryCount,
      this.userGlossaryCount,
      this.userBookStatus,
      this.userBook,
      glossaryData
    );
    this.checkCompact();
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
    this.cdr.detach();
  }
}
