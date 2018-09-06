import { Component, Input, Output, OnInit, OnDestroy, EventEmitter, OnChanges} from '@angular/core';
import { Router } from '@angular/router';
import { Book, UserBook, UserData, TranslationData } from '../../models/book.model';
import { LicenseUrl } from '../../models/course.model';
import { SharedService } from '../../services/shared.service';
import { UserService } from '../../services/user.service';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-book-summary',
  templateUrl: 'book-summary.component.html',
  styleUrls: ['book-summary.component.css']
})

export class BookSummaryComponent implements OnInit, OnChanges, OnDestroy {
  @Input() book: Book;
  @Input() userBook: UserBook;
  @Input() userData: UserData;
  @Input() translationData: TranslationData;
  @Input() userLanCode: string;
  @Input() text: Object;
  @Input() nr: number;
  @Input() tpe: string; // home or read
  @Input() private licenses: LicenseUrl[];
  @Output() removedSubscription = new EventEmitter<Book>();
  private componentActive = true;
  difficultyWidth: number;
  difficultyPerc: number;
  nrOfSentencesDone = 0;
  percDone: number;
  isSubscribed = false;
  isStarted = false;
  isBookRead = false;
  showIntro = false;
  isNewBook = false;
  licenseUrl: string;
  defaultImage = '/assets/img/books/blankcover.png';

  constructor(
    private router: Router,
    private userService: UserService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.getLicenseUrl();
    this.checkIfNew();
    this.setDifficulty();
  }

  ngOnChanges() {
    this.checkIfStarted();
    this.checkSentencesDone();
  }

  onStartReading() {
    this.userService.setLanCode(this.book.lanCode);
    this.userService.setUserLanCode(this.userLanCode);
    this.userService.subscribeToBook(this.book._id, this.userLanCode);
    this.log(`Start reading '${this.book.title}'`);
    this.router.navigate(['/read/book/' + this.book._id + '/' + this.userLanCode]);
  }

  onStopReading() {
    this.userService
    .unSubscribeFromBook(this.book._id, this.userLanCode)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      userBook => {
        if (userBook && !userBook.subscribed) {
          this.isSubscribed = false;
          this.removedSubscription.emit(this.book);
        }
      }
    );
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
      console.log('days since publishing', diffInDays);
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
    this.isStarted = false;
    this.isSubscribed = false;
    this.isBookRead = false;
    this.nrOfSentencesDone = 0;
    this.percDone = 0;
    if (this.userBook) {
      if (this.userBook.subscribed) {
        this.isSubscribed = true;
      }
      if (this.userBook.bookmark) {
        this.isStarted = true;
        if (this.userBook.bookmark.isBookRead) {
          this.nrOfSentencesDone = this.book.difficulty.nrOfSentences;
          this.isBookRead = true;
          this.percDone = 100;
        }
      }
    }
  }

  private checkSentencesDone() {
    if (this.userData) {
      if (!this.isBookRead) {
        this.nrOfSentencesDone = this.userData.nrSentencesDone;
        this.percDone = Math.trunc(Math.min(100, (this.nrOfSentencesDone / this.book.difficulty.nrOfSentences) * 100));
      }
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
