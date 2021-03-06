import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ReadnListenService } from '../../services/readnlisten.service';
import { Map } from '../../models/main.model';
import { Book, UserBook } from '../../models/book.model';
import { takeWhile } from 'rxjs/operators';
import { zip, Subject } from 'rxjs';

const maxAnswers = 25,
      minNoPerc = 10,
      minYesPerc = 70,
      multiplier = 150;
interface Answers {
  nrYes: number;
  nrNo: number;
  total: number;
}

@Component({
  selector: 'km-book-suggestions',
  templateUrl: 'book-suggestions.component.html'
})

export class BookSuggestionsComponent implements OnInit, OnDestroy {
  @Input() book: Book;
  @Input() bookType: string;
  @Input() isTest: boolean;
  @Input() private userLanCode: string;
  @Input() private answersReceived: Subject<{answers: string, isResults: boolean}>;
  @Input() private nextSentence: Subject<string>;
  @Input() text: Object;
  private componentActive = true;
  private books: Book[]; // for suggestions
  private finishedBooks: UserBook[];
  private pastAnswers: string;
  userBooks: Map<UserBook> = {};
  suggestedBooks: Book[] = [];
  isResults = false;

  constructor(
    private readnListenService: ReadnListenService
  ) {}

  ngOnInit() {
    this.getBooks();
    this.observe();
  }

  private getBooks() {
    zip(
      this.readnListenService.fetchPublishedTypeBooks(this.bookType, this.book.lanCode),
      this.readnListenService.fetchUserBooks(this.userLanCode, this.bookType),
      this.readnListenService.fetchPreviousAnswers(this.book._id, this.userLanCode, this.bookType)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(res => {
      this.books = res[0];
      const uBooks = res[1].filter(book => book.isTest === this.isTest);
      this.finishedBooks = this.getFinishedBooks(uBooks);
      this.pastAnswers = this.processPastAnswers(res[2]);
      const userBooks: UserBook[] = res[1];
      this.userBooks = {};
      userBooks.forEach(uBook => {
        this.userBooks[uBook.bookId] = uBook;
      });
    });
  }

  private observe() {
    this.answersReceived
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(answers => {
      if (answers && answers.answers) {
        this.isResults = answers.isResults;
        this.processAnswers(answers.answers);
      }
    });
    this.nextSentence
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(event => {
      if (event) {
        // new sentence, don't show suggestions anymore
        this.suggestedBooks = [];
      }
    });
  }

  private getFinishedBooks(userBooks: UserBook[]) {
    // Keep track finished books so it can be removed from the book list
    return userBooks.filter(book => book.bookmark && book.bookmark.isBookRead);
  }

  private processPastAnswers(pastSessions: string[]): string {
    let answers = '';
    pastSessions.forEach(answer => {
      answers += answer;
    });
    return answers;
  }

  private processAnswers(answers: string) {
    const allAnswers = (this.pastAnswers + answers).slice(-maxAnswers);
    if (allAnswers.length > 4) {
      const answerArr = allAnswers.split(''),
            yes = answerArr.filter(a => a === 'y'),
            no = answerArr.filter(a => a === 'n'),
            total = answerArr.length,
            nrYes = yes ? yes.length : 0,
            nrNo = no ? no.length : 0;
      this.findSuggestions({nrYes, nrNo, total});
    }
  }

  private findSuggestions(answers: Answers) {
    if (this.books) {
      // Remove current book
      this.books = this.books.filter(book => book._id.toString() !== this.book._id.toString());
      // Remove finished books
      this.finishedBooks.forEach(finishedBook => {
        this.books = this.books.filter(book => book._id !== finishedBook.bookId);
      });
      if (this.books.length > 0) {
        const currentWeight = this.book.difficulty.weight,
              yesDelta = ((answers.nrYes / answers.total * 100) - minYesPerc) / 100 * multiplier,
              noDelta = ((answers.nrNo / answers.total * 100) - minNoPerc) / 100 * multiplier;
        let suggestedBooks = this.books.filter(book =>
              book.difficulty.weight > currentWeight - noDelta &&
              book.difficulty.weight < currentWeight + yesDelta
            );
        if (suggestedBooks) {
          const maxSuggestions = this.isResults ? 5 : 3;
          suggestedBooks = this.getRandomElements(suggestedBooks, maxSuggestions);
          // Sort books according to weight
          suggestedBooks.sort(
            (a, b) => (a.difficulty.weight > b.difficulty.weight) ? 1 :
                      ((b.difficulty.weight > a.difficulty.weight) ? -1 : 0)
          );
        }
        this.suggestedBooks = suggestedBooks;
      }
    }
  }

  private getRandomElements(books: Book[], n: number): Book[] {
    let len = books.length,
        x: number;
    const result = new Array(n),
          taken = new Array(len);
    if (n > len) {
      return books;
    }
    while (n--) {
        x = Math.floor(Math.random() * len);
        result[n] = books[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

  ngOnDestroy() {
    this.componentActive = false;
  }
}

