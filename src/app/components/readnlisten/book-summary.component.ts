import { Component, Input, Output, OnInit, OnDestroy, Renderer2, ViewChild, ElementRef, EventEmitter, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Book, UserBook, UserData, TranslationData, UserBookActivity } from '../../models/book.model';
import { LicenseUrl } from '../../models/main.model';
import { UserWordData } from '../../models/word.model';
import { ReadnListenService } from '../../services/readnlisten.service';
import { SharedService } from '../../services/shared.service';
import { UserService } from '../../services/user.service';
import { PlatformService } from '../../services/platform.service';
import { takeWhile } from 'rxjs/operators';

interface UserBookStatus {
  isSubscribed: boolean;
  isRecommended: boolean;
  isStarted: boolean;
  isRepeat: boolean;
  nrOfSentencesDone: number;
  isBookRead: boolean;
  percDone: number;
}

interface ColorHistory {
  red: string;
  orange: string;
  green: string;
}

@Component({
  selector: 'km-book-summary',
  templateUrl: 'book-summary.component.html',
  styleUrls: ['book-summary.component.css']
})

export class BookSummaryComponent implements OnInit, OnChanges, OnDestroy {
  @Input() book: Book;
  @Input() bookType = 'read'; // read or listen or glossary
  @Input() isTest = false; // only true in dashboard
  @Input() userBook: UserBook;
  @Input() userBookTest: UserBook;
  @Input() userData: UserData[];
  @Input() userDataTest: UserData[];
  @Input() userGlossary: UserWordData;
  @Input() glossaryData: UserWordData;
  @Input() translationData: TranslationData;
  @Input() private activity: UserBookActivity;
  @Input() userLanCode: string;
  @Input() text: Object;
  @Input() nr: number;
  @Input() total: number;
  @Input() tpe: string; // home or read or my
  @Input() licenses: LicenseUrl[];
  @Output() removedSubscription = new EventEmitter<Book>();
  @Output() addedSubscription = new EventEmitter<Book>();
  @ViewChild('flashcardDropdown') flashcardDropdown: ElementRef;
  private componentActive = true;
  userBookStatus: UserBookStatus;
  userBookStatusTest: UserBookStatus;
  currentUserData: UserData;
  currentUserTestData: UserData;
  userColors: ColorHistory[][] = [];
  difficultyWidth: number;
  difficultyPerc: number;
  showIntro = false;
  showCredits = false;
  showHistoryData: boolean[] = [false, false];
  isNewBook = false;
  isAllFinished = false;
  isFinished = false; // non-test
  isTestFinished = false;
  isCompact = false;
  showFlashCardDropdown = false;
  defaultImage: string;
  authorsTxt: string;
  linksTxt: string;
  someTooltip: any;
  sourceUrl: string;
  sourceLabel: string;
  translationString: string;
  isTranslated: boolean;
  userCount = 0;
  recommendCount = 0;
  popularity = 0;

  constructor(
    private router: Router,
    private platform: PlatformService,
    private userService: UserService,
    private readnListenService: ReadnListenService,
    private sharedService: SharedService,
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
    this.setDefaultImg();
    this.setSourceLink();
    this.setActivity();
    this.checkIfNew();
    this.setDifficulty();
  }

  ngOnChanges() {
    this.getAllCurrentUserData();
    this.checkIfStarted();
    this.checkIfFinished();
    this.checkSentencesDone();
    this.checkTranslated();
    this.setActivity();
    this.setGlossaryImage();
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
    this.userService.setUserLanCode(this.userLanCode);
    if (isRepeat) {
      this.readnListenService
      .subscribeRepeat(this.book._id, this.userLanCode, this.bookType, this.userBook.bookmark, isTest)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(subscription => {
        this.startReadingListening(this.book._id, this.userLanCode, this.bookType, isTest);
      });
    } else {
      this.readnListenService
      .subscribeToBook(this.book._id, this.userLanCode, this.bookType, isTest)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(subscription => {
        this.startReadingListening(this.book._id, this.userLanCode, this.bookType, isTest);
      });
    }
  }

  onStartListeningTest() {
    this.userService.setLanCode(this.book.lanCode);
    this.userService.setUserLanCode(this.userLanCode);
    this.readnListenService
    .subscribeToBook(this.book._id, this.userLanCode, 'listen', true)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(subscription => {
      this.startReadingListening(this.book._id, this.userLanCode, this.bookType, true);
    });
  }

  onStopReadingListening() {
    this.unsubscribe();
    this.unsubscribeTest();
  }

  onStartFlashcards() {
    this.log(`Start flash cards for ${this.book.title}`);
    this.router.navigate(['/glossaries/flashcards/' + this.book._id + '/' + this.userLanCode]);
  }

  onStartVocabularyTest() {
    console.log('start vocabulary test');
  }

  onWordList() {
    this.router.navigate(['/glossaries/glossary/' + this.book._id + '/' + this.userLanCode]);
  }

  onRevision() {
    this.log(`Start revision for ${this.book.title}`);
    this.router.navigate(['/' + this.bookType + '/book/' + this.book._id + '/' + this.userLanCode + '/review']);
  }

  onToggleFlashCardDropdown() {
    this.showFlashCardDropdown = !this.showFlashCardDropdown;
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

  onToggleRecommend(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.userBookStatus && (this.userBookStatus.isBookRead || this.userBookStatus.isRepeat)) {
      this.saveRecommend();
    }
  }

  onToggleSubscription(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if ((this.userBookStatus && !this.userBookStatus.isSubscribed) || !this.userBookStatus) {
      this.readnListenService
      .subscribeToBook(this.book._id, this.userLanCode, this.bookType, this.isTest)
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
      this.unsubscribeTest();
    }
  }

  onOpen() {
    if (this.isCompact) {
      this.isCompact = false;
    }
  }

  private startReadingListening(bookId: string, userLanCode: string, bookType: string, isTest: boolean) {
    if (isTest) {
      this.log(`Start listening test for '${this.book.title}'`);
      this.router.navigate(['/listen/book/' + bookId + '/' + userLanCode + '/test']);
    } else {
      if (bookType === 'listen') {
        this.log(`Start listening to '${this.book.title}'`);
        this.router.navigate(['/listen/book/' + bookId + '/' + userLanCode]);
      } else {
        this.log(`Start reading '${this.book.title}'`);
        this.router.navigate(['/read/book/' + bookId + '/' + userLanCode]);
      }
    }
  }

  private saveRecommend() {
    this.readnListenService
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

  private unsubscribe() {
    // Unsubscribe from non-test
    if (this.userBook && this.userBookStatus && this.userBookStatus.isSubscribed) {
      this.readnListenService
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
  }

  private unsubscribeTest() {
    // Unsubscribe from test and non-test
    if (this.userBookTest && this.userBookStatusTest && this.userBookStatusTest.isSubscribed) {
      this.readnListenService
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

  private getAllCurrentUserData() {
    // Use the most recent repeat for current user data
    this.currentUserData = this.getCurrentUserData(this.userData);
    this.currentUserTestData = this.getCurrentUserData(this.userDataTest);
  }

  private getCurrentUserData(userData: UserData[]): UserData {
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

  private checkIfFinished() {
    this.isCompact = false;
    if (this.tpe === 'home') {
      this.isAllFinished = (this.userBook && this.userBookStatus.isBookRead) || (this.userBookTest && this.userBookStatusTest.isBookRead);
    } else {
      if (this.userBook && this.userBookTest) {
        // test + no test -> both must be finished
        this.isAllFinished = this.userBookStatus.isBookRead && this.userBookStatusTest.isBookRead;
      } else if (this.userBook) {
        // only read
        this.isAllFinished = this.userBookStatus.isBookRead || this.userBook.repeatCount > 0;
        this.isCompact = this.userBookStatus.isBookRead && this.tpe === 'read' && this.bookType === 'read';
      }
    }
    this.isFinished = this.userBook && this.userBookStatus.isBookRead;
    this.isTestFinished = this.userBookTest && this.userBookStatusTest.isBookRead;
  }

  private checkIfNew() {
    const published = this.book.dt ? this.book.dt.published : null;
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

  private setDifficulty() {
    const difficulty = this.sharedService.getBookDifficulty(this.book);
    this.difficultyWidth = difficulty.difficultyWidth;
    this.difficultyPerc = difficulty.difficultyPerc;
  }

  private checkIfStarted() {
    this.userBookStatus = this.resetBook();
    this.userBookStatusTest = this.resetBook();
    this.initBook(this.userBookStatus, this.userBook);
    this.initBook(this.userBookStatusTest, this.userBookTest);
  }

  private initBook(status: UserBookStatus, userBook: UserBook) {
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
        }
      }
    }
  }

  private resetBook() {
    return {
      isSubscribed: false,
      isRecommended: false,
      isStarted: false,
      isBookRead: false,
      isRepeat: false,
      nrOfSentencesDone: 0,
      percDone: 0
    };
  }

  private checkTranslated() {
    if (this.translationData && this.translationData.count > 0) {
      const translated = this.translationData.count || 0,
            unique = this.book.difficulty ? this.book.difficulty.nrOfUniqueSentences || 0 : 0,
            maxTranslated = translated > unique ? unique : translated;
      this.translationString = `${maxTranslated} / ${unique}`;
      this.isTranslated = maxTranslated >= unique;
    } else {
      this.isTranslated = false;
      this.translationString = '';
    }
  }

  private checkSentencesDone() {
    this.checkSentencesDoneEach(this.currentUserData, this.userBookStatus);
    this.checkSentencesDoneEach(this.currentUserTestData, this.userBookStatusTest);
  }

  private checkSentencesDoneEach(userData: UserData, status: UserBookStatus) {
    if (userData) {
      if (!status.isBookRead && status.isStarted) {
        status.nrOfSentencesDone = userData.nrSentencesDone;
        status.percDone = Math.trunc(Math.min(100, (status.nrOfSentencesDone / this.book.difficulty.nrOfSentences) * 100));
      }
    }
  }

  private setActivity() {
    if (this.activity) {
      this.userCount = this.activity.started;
      this.recommendCount = this.userCount > 0 ? this.activity.recommended : 0;
      this.popularity = this.activity.popularity;
    }
  }

  private setDefaultImg() {
    this.defaultImage = this.bookType === 'listen' ? '/assets/img/books/blankrecord.png' : '/assets/img/books/blankcover.png';
  }

  private setGlossaryImage() {
    if (this.bookType === 'glossary' && this.book.img) {
      if (!this.book.img.includes('glossary')) {
        const readPath = '/jazyk/books/' + this.book.lanCode + '/',
              glossaryPath = readPath + 'glossary/';
        console.log('img path', this.book.img, readPath, glossaryPath);
        this.book.img = this.book.img.replace(readPath, glossaryPath);
      }
    }
  }

  private setSourceLink() {
    const source = this.book.source;
    if (source && source.substr(0, 4) === 'http') {
      this.sourceUrl = source;
      this.sourceLabel = source.split('//')[1];
    } else {
      this.sourceLabel = source;
      this.sourceUrl = null;
    }
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'BookSummaryComponent'
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
