import { Component, Input, Output, OnInit, OnDestroy, EventEmitter, OnChanges} from '@angular/core';
import { Router } from '@angular/router';
import { Book, UserBook, UserData } from '../../models/book.model';
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
  @Input() userLanCode: string;
  @Input() text: Object;
  @Output() removedSubscription = new EventEmitter<Book>();
  private componentActive = true;
  difficultyWidth: number;
  difficultyPerc: number;
  nrOfSentencesDone = 0;
  percDone: number;
  isSubscribed = false;
  isStarted = false;
  isBookRead = false;
  defaultImage = '/assets/img/books/blankcover.png';

  constructor(
    private router: Router,
    private userService: UserService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.setDifficulty();
  }

  ngOnChanges() {
    this.checkIfStarted();
    this.checkSentencesDone();
  }

  onStartReading() {
    console.log('Start reading', this.book);
    this.userService.setLanCode(this.book.lanCode);
    this.userService
    .subscribeToBook(this.book._id)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      userBook => {
        if (userBook && userBook.subscribed) {
          this.isSubscribed = true; // not really necessary due to route change
        }
      }
    );
    this.log(`Start reading '${this.book.title}'`);
    this.router.navigate(['/read/book/' + this.book._id]);
  }

  onStopReading() {
    console.log('Stop reading', this.book);
    this.userService
    .unSubscribeFromBook(this.book._id)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      userBook => {
        console.log('books', userBook);
        if (userBook && !userBook.subscribed) {
          this.isSubscribed = false;
          this.removedSubscription.emit(this.book);
        }
      }
    );
  }

  private setDifficulty() {
    let difficulty = this.book.difficulty.weight;
    difficulty = difficulty - 300;
    difficulty = Math.max(10, difficulty);
    difficulty = difficulty * 1.8;
    difficulty = Math.min(1000, difficulty);
    this.difficultyWidth = Math.round(difficulty / 5);
    this.difficultyPerc = Math.round(difficulty / 10);
  }

  private checkIfStarted() {
    this.isStarted = false;
    this.isSubscribed = false;
    this.isBookRead = false;
    this.nrOfSentencesDone = 0;
    this.percDone = 0;
    if (this.userBook) {
      this.isStarted = true;
      if (this.userBook.subscribed) {
        this.isSubscribed = true;
      }
      if (this.userBook.bookmark) {
        console.log('bookmark', this.userBook.bookmark);
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
        console.log('user data', this.book.title, this.userData);
        this.nrOfSentencesDone = this.userData.nrSentencesDone;
        this.percDone = Math.min(100, (this.nrOfSentencesDone / this.book.difficulty.nrOfSentences) * 100);
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
