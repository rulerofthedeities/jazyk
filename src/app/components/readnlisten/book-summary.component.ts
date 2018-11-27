import { Component, Input, Output, OnInit, OnDestroy, EventEmitter, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Book, UserBook, UserData, TranslationData } from '../../models/book.model';
import { LicenseUrl } from '../../models/main.model';
import { ReadnListenService } from '../../services/readnlisten.service';
import { SharedService } from '../../services/shared.service';
import { UserService } from '../../services/user.service';
import { takeWhile } from 'rxjs/operators';

interface UserBookStatus {
  isSubscribed: boolean;
  isRecommended: boolean;
  isStarted: boolean;
  nrOfSentencesDone: number;
  isBookRead: boolean;
  percDone: number;
}

interface ColorHistory {
  red: string;
  orange: string;
  green: string;
  nrRed: number;
  nrOrange: number;
  nrGreen: number;
}

@Component({
  selector: 'km-book-summary',
  templateUrl: 'book-summary.component.html',
  styleUrls: ['book-summary.component.css']
})

export class BookSummaryComponent implements OnInit, OnChanges, OnDestroy {
  @Input() book: Book;
  @Input() bookType = 'read'; // read or listen
  @Input() isTest = false;
  @Input() userBook: UserBook;
  @Input() userBookTest: UserBook;
  @Input() userData: UserData[];
  @Input() userDataTest: UserData[];
  @Input() translationData: TranslationData;
  @Input() userLanCode: string;
  @Input() text: Object;
  @Input() nr: number;
  @Input() tpe: string; // home or read
  @Input() licenses: LicenseUrl[];
  @Output() removedSubscription = new EventEmitter<Book>();
  private componentActive = true;
  userBookStatus: UserBookStatus;
  userBookStatusTest: UserBookStatus;
  currentUserData: UserData;
  currentUserTestData: UserData;
  userColors: ColorHistory[];
  difficultyWidth: number;
  difficultyPerc: number;
  showIntro = false;
  showHistoryData = false;
  isNewBook = false;
  isFinished = false;
  defaultImage: string;
  authorsTxt: string;
  linksTxt: string;
  someTooltip: any;

  constructor(
    private router: Router,
    private userService: UserService,
    private readnListenService: ReadnListenService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.setDefaultImg();
    this.setAuthors();
    this.checkIfNew();
    this.setDifficulty();
  }

  ngOnChanges() {
    this.getAllCurrentUserData();
    this.checkIfStarted();
    this.checkIfFinished();
    this.checkSentencesDone();
  }

  onShowRepeatHistory() {
    console.log('show history');
    if (!this.showHistoryData) {
      this.userColors = [];
      let total: number,
          red: number,
          orange: number,
          green: number;
      this.userData.forEach(data => {
        total = data.nrNo + data.nrMaybe + data.nrYes;
        red = Math.round(data.nrNo / total * 100);
        orange = Math.round(data.nrMaybe / total * 100);
        green = 100 - red - orange;
        console.log('colors', data, red, orange, green);
        this.userColors.push({
          nrRed: data.nrNo,
          nrOrange: data.nrMaybe,
          nrGreen: data.nrYes,
          red: red.toString(),
          orange: orange.toString(),
          green: green.toString()
        });
      });
    }
    this.showHistoryData = !this.showHistoryData;
    console.log(this.showHistoryData, this.userData);
  }

  onStartReadingListening(isRepeat = false) {
    this.userService.setLanCode(this.book.lanCode);
    this.userService.setUserLanCode(this.userLanCode);
    console.log('bookmark', this.userBook.bookmark);
    if (isRepeat) {
      this.readnListenService
      .subscribeRepeat(this.book._id, this.userLanCode, this.bookType, this.userBook.bookmark, this.isTest)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(subscription => {
        this.startReadingListening();
      });
    } else {
      this.readnListenService
      .subscribeToBook(this.book._id, this.userLanCode, this.bookType, this.isTest)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(subscription => {
        this.startReadingListening();
      });
    }
  }

  onStartListeningTest() {
    this.userService.setLanCode(this.book.lanCode);
    this.userService.setUserLanCode(this.userLanCode);
    this.readnListenService
    .subscribeToBook(this.book._id, this.userLanCode, 'listen', this.isTest)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(subscription => {
      this.startReadingListeningTest();
    });
  }

  onStopReadingListening() {
    this.unsubscribe();
    this.unsubscribeTest();
  }

  onToggleIntro() {
    this.showIntro = !this.showIntro;
  }

  onToggleRecommend() {
    if (this.userBookStatus && this.userBookStatus.isBookRead) {
      this.saveRecommend();
    }
  }

  onToggleSubscription() {
    if ((this.userBookStatus && !this.userBookStatus.isSubscribed) || !this.userBookStatus) {
      this.readnListenService
      .subscribeToBook(this.book._id, this.userLanCode, this.bookType, this.isTest)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        userBook => {
          if (userBook && userBook.subscribed) {
            this.userBookStatus.isSubscribed = true;
          }
        }
      );
    } else {
      this.unsubscribe();
    }
  }

  getTranslated(translationData: TranslationData, book: Book): string {
    const translated = translationData.count || 0,
          unique = book.difficulty ? book.difficulty.nrOfUniqueSentences || 0 : 0,
          maxTranslated = translated > unique ? unique : translated;

    return `${maxTranslated} / ${unique}`;
  }

  private playIosWorkaround() {
    const audio = new Audio();
    audio.src = '/assets/audio/gluck.ogg';
    audio.load();
    audio.onloadeddata = () => {
      if (audio) {
        console.log('audio loaded');
        // audio.play();
      }
    };
  }

  private startReadingListening() {
    this.playIosWorkaround();
    if (this.bookType === 'listen') {
      this.log(`Start listening to '${this.book.title}'`);
      this.router.navigate(['/listen/book/' + this.book._id + '/' + this.userLanCode]);
    } else {
      this.log(`Start reading '${this.book.title}'`);
      this.router.navigate(['/read/book/' + this.book._id + '/' + this.userLanCode]);
    }
  }

  private startReadingListeningTest() {
    this.playIosWorkaround();
    this.log(`Start listening test for '${this.book.title}'`);
    this.router.navigate(['/listen/book/' + this.book._id + '/' + this.userLanCode + '/test']);
  }

  private saveRecommend() {
    this.readnListenService
    .recommendBook(this.userBook._id, !this.userBookStatus.isRecommended)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      updated => {
        this.userBookStatus.isRecommended = !this.userBookStatus.isRecommended;
        this.userBook.recommended = this.userBookStatus.isRecommended;
      }
    );
  }

  private unsubscribe() {
    // Unsubscribe from non-test
    if (this.userBookStatus && this.userBookStatus.isSubscribed) {
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
    if (this.userBookStatusTest && this.userBookStatusTest.isSubscribed) {
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
        userData.sort(
          (a, b) => (a.repeatCount > b.repeatCount) ? 1 : ((b.repeatCount > a.repeatCount) ? -1 : 0)
        );
        console.log('sorted data', userData);
      }
      return userData[0];
    } else {
      return null;
    }
  }

  private checkIfFinished() {
    if (this.tpe === 'home') {
      this.isFinished = (this.userBook && this.userBookStatus.isBookRead) || (this.userBookTest && this.userBookStatusTest.isBookRead);
    } else {
      if (this.userBook && this.userBookTest) {
        // test + no test -> both must be finished
        this.isFinished = this.userBookStatus.isBookRead && this.userBookStatusTest.isBookRead;
      } else if (this.userBook) {
        // only read
        this.isFinished = this.userBookStatus.isBookRead;
      }
    }
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
      if (userBook.bookmark) {
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
      nrOfSentencesDone: 0,
      percDone: 0
    };
  }

  private checkSentencesDone() {
    this.checkSentencesDoneEach(this.currentUserData, this.userBookStatus);
    this.checkSentencesDoneEach(this.currentUserTestData, this.userBookStatusTest);
  }

  private checkSentencesDoneEach(userData: UserData, status: UserBookStatus) {
    if (userData) {
      if (!status.isBookRead) {
        status.nrOfSentencesDone = userData.nrSentencesDone;
        status.percDone = Math.trunc(Math.min(100, (status.nrOfSentencesDone / this.book.difficulty.nrOfSentences) * 100));
      }
    }
  }

  private setAuthors() {
    const authorsLinksTxt = this.sharedService.getAuthorsLinksTxt(this.book);
    this.authorsTxt = authorsLinksTxt.authorsTxt;
    this.linksTxt = authorsLinksTxt.linksTxt;
  }

  private setDefaultImg() {
    this.defaultImage = this.bookType === 'listen' ? '/assets/img/books/blankrecord.png' : '/assets/img/books/blankcover.png';
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
