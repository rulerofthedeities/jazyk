import { Component, Input, Output, OnInit, OnDestroy, EventEmitter,
         ChangeDetectionStrategy, ChangeDetectorRef, ViewChildren } from '@angular/core';
import { TooltipDirective } from 'ng2-tooltip-directive';
import { SharedService } from '../../services/shared.service';
import { StoriesService } from 'app/services/stories.service';
import { LicenseUrl } from '../../models/main.model';
import { Book, UserBookActivity, UserBookLean, UserBookStatus, UserData,
         FinishedTab, TranslationData, StoryData } from 'app/models/book.model';
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
  @Input() isMyList: boolean;
  @Input() isSingleBook = false;
  @Input() private dataLoaded: Subject<StoryData>;
  @Output() removedSubscription = new EventEmitter<Book>();
  @Output() addedSubscription = new EventEmitter<Book>();
  @ViewChildren(TooltipDirective) tooltipDirective;
  private componentActive = true;
  private userData: UserData[];
  private userDataTest: UserData[];
  currentUserData: UserData;
  currentUserTestData: UserData;
  userBookStatus: UserBookStatus;
  userBookStatusTest: UserBookStatus;
  userBook: UserBookLean;
  userBookTest: UserBookLean;
  userGlossaryCount: UserWordCount;
  userGlossaryData: UserWordData;
  glossaryCount: UserWordCount;
  translationCount: number;
  isFinished = false;
  showCompact: boolean;
  tabChanged = false;
  isNewBook = false;
  isLoading = true;
  isIconsReady = false;
  isSubscribed = false;
  isRecommended = false;
  userCount = 0;
  recommendCount = 0;
  popularity = 0;
  coverImage: string;
  hasImage: boolean;
  audioTitle: string;
  hasAudioTitle: boolean;
  hasFlashCards: boolean;
  isTranslated = false;
  isUserTranslated = false;
  hasTest = false;
  translationString: string;
  difficultyWidth: number;
  difficultyPerc: number;
  showHistoryData: boolean[] = [false, false];
  userColors: ColorHistory[][] = [];
  currentTab: string;
  isError = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private sharedService: SharedService,
    private storiesService: StoriesService
  ) {}

  ngOnInit() {
    this.showCompact = !this.isSingleBook;
    this.currentTab = this.tab;
    this.setTab();
    this.observe();
    this.setCoverImage();
    this.setAudioFile();
    this.setActivity();
    this.checkIfNew();
    this.setDifficulty();
    this.sharedService.detectChanges(this.cdr);
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
    if (!this.isSubscribed) {
      this.doSubscribe();
    } else {
      this.unsubscribe();
    }
  }

  onToggleRecommend(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.userBookStatus && (this.userBookStatus.isBookRead || this.userBookStatus.isRepeat)) {
      if (this.isRecommended) {
        this.unRecommend();
      } else {
        this.doRecommend();
      }
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
      this.currentUserData = null;
      this.currentUserTestData = null;
      zip(
        this.storiesService.fetchStoryUserBooks(this.targetLanCode, this.tab, this.book._id),
        this.storiesService.fetchStoryUserWords(this.targetLanCode, this.book._id),
        this.storiesService.fetchStoryWordTranslations(this.targetLanCode, this.book._id), // For translation count
        this.storiesService.fetchStoryBookWords(this.book._id)
      )
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(data => {
        if (data && data.length) {
          this.processUserBooks(data[0]);
          this.processGlossaryData(data[1], data[2], data[3]);
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
    if (this.finishedTabs && this.finishedTabs[this.tab]) {
      this.isFinished = true;
    } else {
      this.isFinished = false;
    }
    if (!this.tabChanged) {
      // only show compact format initially, not when a tab is clicked
      if (this.isFinished && this.userBookStatus && !this.userBookStatus.isStarted) {
        this.showCompact = !this.isSingleBook; // do not show compact if it is a filtered book
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

  private setIcons() {
    this.isSubscribed = this.userBook ? this.userBook.subscribed : false;
    this.isRecommended = this.userBook ? this.userBook.recommended : false;
    this.isIconsReady = true;
  }

  private processAllCurrentUserData() {
    this.currentUserData = this.storiesService.getCurrentUserData(this.userData);
    this.currentUserTestData = this.storiesService.getCurrentUserData(this.userDataTest);
    this.checkSentencesDone(this.currentUserData, this.currentUserTestData);
  }

  private checkSentencesDone(currentUserData: UserData, currentUserTestData: UserData) {
    this.storiesService.checkSentencesDone(this.book, currentUserData, this.userBookStatus);
    this.storiesService.checkSentencesDone(this.book, currentUserTestData, this.userBookStatusTest);
  }

  private processGlossaryData(userGlossaryData: UserWordData, glossaryCount: UserWordCount, totalCount: UserWordCount = null) {
    this.glossaryCount = glossaryCount;
    if (totalCount) {
      if (this.glossaryCount) {
        this.glossaryCount.countTotal = totalCount.countTotal;
      } else {
        this.glossaryCount = {
          countTotal: totalCount.countTotal,
          countTranslation: 0
        }
      }
    }
    const translated = glossaryCount ? glossaryCount.countTranslation : 0;
    if (translated > 0 && translated >= this.glossaryCount.countTotal) {
      glossaryCount.countTranslation = this.glossaryCount.countTotal;
      this.isTranslated = true;
    } else {
      this.isTranslated = false;
    }

    this.userGlossaryCount = this.processUserGlossaryData(userGlossaryData);
    this.currentUserData = this.storiesService.checkGlossaryStatus(
      this.book,
      glossaryCount,
      this.userGlossaryCount,
      this.userBookStatus,
      this.userBook,
      userGlossaryData
    );

    this.hasFlashCards = this.storiesService.hasFlashCards(this.glossaryCount, this.userGlossaryCount);
    this.checkCompact();
  }

  private processUserGlossaryData(userGlossaryData: UserWordData): UserWordCount {
    const pinned = userGlossaryData ? userGlossaryData.pinned : 0;
    const translated = userGlossaryData ? userGlossaryData.translated : 0;
    if (translated > 0 && translated >= pinned) {
      userGlossaryData.pinned = pinned;
      this.isUserTranslated = true;
    } else {
      this.isUserTranslated = false;
    }

    return {
      countTotal: userGlossaryData ? userGlossaryData.pinned : 0,
      countTranslation: userGlossaryData ? userGlossaryData.translated : 0
    };
  }

  private doSubscribe() {
    this.storiesService
    .subscribeToBook(this.book._id, this.targetLanCode, this.tab, false)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      userBook => {
        if (userBook && userBook.subscribed) {
          this.isSubscribed = true;
          this.addedSubscription.emit(this.book);
        }
      }
    );
  }

  private unsubscribe() {
    // Unsubscribe from all userbooks for this book / user / targetlan
    if (this.isSubscribed) {
      this.storiesService
      .unSubscribeFromBook(this.book._id, this.targetLanCode)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        userBook => {
          if (userBook) {
            this.isSubscribed = false;
            this.removedSubscription.emit(this.book);
          }
        }
      );
    }
  }

  private doRecommend() {
    this.storiesService
    .recommendBook(this.userBook._id)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      updated => {
        if (updated) {
          this.isRecommended = true;
          this.userBook.recommended = true;
          this.activity.recommended += 1;
          this.recommendCount = this.activity.recommended;
        }
      }
    );
  }

  private unRecommend() {
    // Unrecommend from all userbooks for this book / user / targetlan
    this.storiesService
    .unRecommendBook(this.book._id, this.targetLanCode)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      updated => {
        if (updated) {
          this.isRecommended = false;
          this.userBook.recommended = false;
          this.activity.recommended -= 1;
          this.activity.recommended = this.activity.recommended < 0 ? 0 : this.activity.recommended;
          this.recommendCount = this.activity.recommended;
        }
      }
    );
  }

  private observe() {
    this.dataLoaded
    .pipe(takeWhile( () => this.componentActive))
    .subscribe(storyData => {
      if (storyData) {
        this.processAsyncData(storyData);
      }
    });
  }

  private processAsyncData(storyData: StoryData) {
    this.resetStatus();
    this.userData = storyData.userData;
    this.userDataTest = storyData.userDataTest;
    this.userBook = storyData.userBook;
    this.userBookTest = storyData.userBookTest;
    this.glossaryCount = storyData.glossaryCount;
    this.userGlossaryCount = storyData.userGlossaryCount;
    this.userGlossaryData = storyData.userGlossaryData;
    this.translationCount = storyData.translationCount;

    if (this.tab === 'glossary') {
      this.processGlossaryData(this.userGlossaryData, this.glossaryCount);
    } else {
      this.processAllCurrentUserData();
      this.checkTranslated();
    }
    this.checkStatus();
    this.setIcons();
    this.isLoading = false;
    this.sharedService.detectChanges(this.cdr);
  }

  ngOnDestroy() {
    const tooltipRemove = this.tooltipDirective.find(elem => elem.id === ('tooltipRemove'));
    if (tooltipRemove) {
      tooltipRemove.hide();
    }
    this.componentActive = false;
    if (this.cdr) {
      this.cdr.detach();
    }
  }
}
