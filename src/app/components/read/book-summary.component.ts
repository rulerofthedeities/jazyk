import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Book, UserBook } from '../../models/book.model';
import { SharedService } from '../../services/shared.service';
import { UserService } from '../../services/user.service';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-book-summary',
  templateUrl: 'book-summary.component.html',
  styleUrls: ['book-summary.component.css']
})

export class BookSummaryComponent implements OnInit, OnDestroy {
  @Input() book: Book;
  @Input() userBook: UserBook;
  @Input() text: Object;
  private componentActive = true;
  difficultyWidth: number;
  difficultyPerc: number;
  nrOfSentencesDone = 10;
  percDone: number;
  isSubscribed = false;
  defaultImage = 'https://s3.eu-central-1.amazonaws.com/jazyk/books/blankbookcover.png';

  constructor(
    private router: Router,
    private userService: UserService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.setDifficulty();
    this.percDone = Math.trunc(this.nrOfSentencesDone / this.book.difficulty.nrOfSentences * 100);
  }

  onStartReading() {
    console.log('Start reading', this.book);
    this.userService.setLanCode(this.book.lanCode);
    this.userService
    .subscribeToBook(this.book._id)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      userBook => {
        console.log('books', userBook);
        if (userBook && userBook.subscribed) {
          this.isSubscribed = true;
        }
      }
    );
    this.log(`Start reading '${this.book.title}'`);
    // this.router.navigate(['/read/book/' + this.book._id]);
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
        }
      }
    );
  }

  private setDifficulty() {
    let difficulty = this.book.difficulty.weight;
    difficulty = difficulty - 250;
    difficulty = Math.max(50, difficulty);
    difficulty = difficulty * 1.34;
    difficulty = Math.min(1000, difficulty);
    this.difficultyWidth = Math.round(difficulty / 5);
    this.difficultyPerc = Math.round(difficulty / 10);
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'CourseSummaryComponent'
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
