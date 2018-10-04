import { Component, Input, Output, OnInit, OnDestroy, EventEmitter, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Book, UserBook, UserData, TranslationData } from '../../models/book.model';
import { LicenseUrl } from '../../models/main.model';
import { SharedService } from '../../services/shared.service';
import { UserService } from '../../services/user.service';
import { takeWhile } from 'rxjs/operators';

interface UserBookStatus {
  isSubscribed: boolean;
  isStarted: boolean;
  nrOfSentencesDone: number;
  isBookRead: boolean;
  percDone: number;
}

@Component({
  selector: 'km-book-summary',
  templateUrl: 'book-summary.component.html',
  styleUrls: ['book-summary.component.css']
})

export class BookSummaryComponent implements OnInit, OnChanges, OnDestroy {
  @Input() book: Book;
  @Input() bookType = 'read'; // read or listen
  @Input() userBook: UserBook;
  @Input() userBookTest: UserBook;
  @Input() userData: UserData;
  @Input() userDataTest: UserData;
  @Input() translationData: TranslationData;
  @Input() userLanCode: string;
  @Input() text: Object;
  @Input() nr: number;
  @Input() tpe: string; // home or read
  @Input() private licenses: LicenseUrl[];
  @Output() removedSubscription = new EventEmitter<Book>();
  private componentActive = true;
  // nrOfSentencesDone = 0;
  // percDone: number;
  // isSubscribed = false;
  // isStarted = false;
  // isStartedTest = false;
  // isBookRead = false;
  userBookStatus: UserBookStatus;
  userBookStatusTest: UserBookStatus;
  difficultyWidth: number;
  difficultyPerc: number;
  showIntro = false;
  isNewBook = false;
  licenseUrl: string;
  defaultImage: string;
  authorsTxt: string;
  linksTxt: string;

  constructor(
    private router: Router,
    private userService: UserService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.setDefaultImg();
    this.setAuthors();
    this.getLicenseUrl();
    this.checkIfNew();
    this.setDifficulty();
  }

  ngOnChanges() {
    this.checkIfStarted();
    this.checkSentencesDone();
  }

  onStartReadingListening() {
    this.userService.setLanCode(this.book.lanCode);
    this.userService.setUserLanCode(this.userLanCode);
    this.userService.subscribeToBook(this.book._id, this.userLanCode, this.bookType);
    if (this.bookType === 'listen') {
      console.log('start listening');
      this.log(`Start listening to '${this.book.title}'`);
      this.router.navigate(['/listen/book/' + this.book._id + '/' + this.userLanCode]);
    } else {
      console.log('start reading');
      this.log(`Start reading '${this.book.title}'`);
      this.router.navigate(['/read/book/' + this.book._id + '/' + this.userLanCode]);
    }
  }

  onStartListeningTest() {
    console.log('start listening test');
    this.userService.setLanCode(this.book.lanCode);
    this.userService.setUserLanCode(this.userLanCode);
    this.userService.subscribeToBook(this.book._id, this.userLanCode, 'listen', true);
    this.router.navigate(['/listen/book/' + this.book._id + '/' + this.userLanCode + '/test']);
  }

  onStopReadingListening() {
    // Unsubscribe from non-test
    if (this.userBookStatus && this.userBookStatus.isSubscribed) {
      this.userService
      .unSubscribeFromBook(this.book._id, this.userLanCode, this.bookType, false)
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
    // Unsubscribe from test and non-test
    if (this.userBookStatusTest && this.userBookStatusTest.isSubscribed) {
      this.userService
      .unSubscribeFromBook(this.book._id, this.userLanCode, this.bookType, true)
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

  onToggleIntro() {
    this.showIntro = !this.showIntro;
  }

  private getLicenseUrl() {
    if (this.licenses) {
      const license = this.licenses.find(l => this.book.license === l.license);
      if (license) {
        this.licenseUrl = license.url;
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
      if (userBook.subscribed) {
        status.isSubscribed = true;
      }
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
      isStarted: false,
      isBookRead: false,
      nrOfSentencesDone: 0,
      percDone: 0
    };
  }

  private checkSentencesDone() {
    this.checkSentencesDoneEach(this.userData, this.userBookStatus);
    this.checkSentencesDoneEach(this.userDataTest, this.userBookStatusTest);
  }

  checkSentencesDoneEach(userData: UserData, status: UserBookStatus) {
    if (userData) {
      if (!status.isBookRead) {
        status.nrOfSentencesDone = userData.nrSentencesDone;
        status.percDone = Math.trunc(Math.min(100, (status.nrOfSentencesDone / this.book.difficulty.nrOfSentences) * 100));
      }
    }
  }

  private setAuthors() {
    const authors: string[] = this.book.authors ? this.book.authors.split(';') : [],
          links: string[] = this.book.links ? this.book.links.split(';') : [];
    // Set author string for blank book image
    this.authorsTxt = authors[0];
    if (links[0]) {
      this.linksTxt = `<a href="${links[0]}">${authors[0]}</a>`;
    } else {
      this.linksTxt = this.authorsTxt;
    }
    if (authors.length > 1) {
      this.authorsTxt += ' & ' + authors[1];
      if (links.length > 1) {
        this.linksTxt += ` & <a href="${links[1]}">${authors[1]}</a>`;
      } else {
        this.linksTxt += ' & ' + authors[1];
      }
    }
  }

  private setDefaultImg() {
    this.defaultImage = this.bookType === 'listen' ? '/assets/img/books/blankrecord.jpg' : '/assets/img/books/blankcover.png';
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
