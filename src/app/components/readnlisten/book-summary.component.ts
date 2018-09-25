import { Component, Input, Output, OnInit, OnDestroy, EventEmitter, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Book, UserBook, UserData, TranslationData } from '../../models/book.model';
import { LicenseUrl } from '../../models/main.model';
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
  @Input() mainTpe = 'read'; // read or listen
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

  onStartReading() {
    this.userService.setLanCode(this.book.lanCode);
    this.userService.setUserLanCode(this.userLanCode);
    this.userService.subscribeToBook(this.book._id, this.userLanCode);
    if (this.mainTpe === 'listen') {
      console.log('start listen');
      this.log(`Start listening to '${this.book.title}'`);
      this.router.navigate(['/listen/book/' + this.book._id + '/' + this.userLanCode]);
    } else {
      console.log('start reading');
      this.log(`Start reading '${this.book.title}'`);
      this.router.navigate(['/read/book/' + this.book._id + '/' + this.userLanCode]);
    }
  }

  onStartListening() {
    console.log('start listening');
    this.userService.setLanCode(this.book.lanCode);
    this.userService.setUserLanCode(this.userLanCode);
    this.userService.subscribeToBook(this.book._id, this.userLanCode);
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
    this.defaultImage = this.mainTpe === 'listen' ? '/assets/img/books/blankrecord.jpg' : '/assets/img/books/blankcover.png';
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
