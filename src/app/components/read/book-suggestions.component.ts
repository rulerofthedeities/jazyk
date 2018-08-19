import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ReadService } from '../../services/read.service';
import { Map } from '../../models/course.model';
import { Book, UserBook, UserData } from '../../models/book.model';
import { takeWhile } from 'rxjs/operators';
import { zip, Subject } from 'rxjs';

const maxAnswers = 20,
      maxYesEasierPerc = 0.86, // max nr of yes answers for easier suggestions
      minNoEasierPerc = 0.2, // min nr of no answers for easier suggestions
      maxNoHarderPerc = 0.08, // max nr of no answers for harder suggestions
      minYesHarderPerc = 0.7; // min nr of yes answers for harder suggestions
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
  @Input() private userLanCode: string;
  @Input() private answersReceived: Subject<string>;
  private componentActive = true;
  private books: Book[]; // for suggestions
  private finishedBooks: UserBook[];
  private pastAnswers: string;
  showSuggestions = false;
  showHarderSuggestions = false;
  showEasierSuggestions = false;
  harderBooks: Book[] = [];
  easierBooks: Book[] = [];

  constructor(
    private readService: ReadService
  ) {}

  ngOnInit() {
    this.getBooks();
    this.observe();
  }

  private getBooks() {
    zip(
      this.readService.fetchPublishedBooksByWeight(this.book.lanCode),
      this.readService.fetchUserBooks(this.userLanCode),
      this.readService.fetchPreviousAnswers(this.book._id, this.userLanCode)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(res => {
      this.books = res[0];
      this.finishedBooks = this.removeFinishedBooks(res[1]);
      this.pastAnswers = this.processPastAnswers(res[2]);
      console.log('books', this.books);
      console.log('user books', this.finishedBooks);
      console.log('previous', res[2]);
    });
  }

  private observe() {
    this.answersReceived
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(event => {
      if (event) {
        this.processAnswers(event);
      }
    });
  }

  private removeFinishedBooks(userBooks: UserBook[]) {
    // Remove finished books from list
    return userBooks.filter(book => book.bookmark && book.bookmark.isBookRead);
  }

  private processPastAnswers(pastSessions: string[]): string {
    let answers = '';
    pastSessions.forEach(answer => {
      answers += answer;
    });
    console.log('past answers', answers);
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
      if (nrYes / total < 0.86) {
        this.showEasierSuggestions = true;
      }
      if (nrNo / total < 0.08) {
        this.showHarderSuggestions = true;
      }
      if (this.showEasierSuggestions || this.showHarderSuggestions) {
        this.findSuggestions({nrYes, nrNo, total});
      }
    }
  }

  private findSuggestions(answers: Answers) {
    console.log('answers', answers);
    const weightCoefficientHarder = this.getWeightCoefficient('harder', answers),
          weightCoefficientEasier = this.getWeightCoefficient('easier', answers);
    console.log('coefficients', weightCoefficientHarder, weightCoefficientEasier);
    this.showSuggestions = false;
    if (this.finishedBooks) {
      const weightDeltaLargeRange = [50, 100], // Min diff for easier / harder books unless there are none
            weightDeltaLSmallRange = [0, 50], // Only used if Large yields no results
            currentWeight = this.book.difficulty.weight;
      let harderBooks: Book[] = [],
          easierBooks: Book[] = [];
      this.finishedBooks.forEach(finishedBook => {
        this.books = this.books.filter(book => book._id !== finishedBook.bookId);
      });
      console.log('books after removing finished ones', this.books);
      if (this.books.length > 0) {
        // Find easier / harder books
        harderBooks = this.books.filter(book =>
          book.difficulty.weight > currentWeight + weightDeltaLargeRange[0] &&
          book.difficulty.weight < currentWeight + weightDeltaLargeRange[1] * weightCoefficientHarder
        );
        easierBooks = this.books.filter(book =>
          book.difficulty.weight < currentWeight - weightDeltaLargeRange[0] &&
          book.difficulty.weight > currentWeight - weightDeltaLargeRange[1] * weightCoefficientEasier
        );
        // If none found, use smaller delta
        if (harderBooks.length < 1) {
          harderBooks = this.books.filter(book =>
            book.difficulty.weight > currentWeight + weightDeltaLSmallRange[0] &&
            book.difficulty.weight < currentWeight + weightDeltaLSmallRange[1]
          );
        }
        if (easierBooks.length < 1) {
          easierBooks = this.books.filter(book =>
            book.difficulty.weight < currentWeight - weightDeltaLSmallRange[0] &&
            book.difficulty.weight > currentWeight - weightDeltaLSmallRange[1]
          );
        }
        this.easierBooks = easierBooks;
        this.harderBooks = harderBooks;
        console.log('easier books', easierBooks);
        console.log('harder books', harderBooks);

        this.showHarderSuggestions = this.checkIfHarderSuggestions(answers);
        this.showEasierSuggestions = this.checkIfEasierSuggestions(answers);
        if (this.showEasierSuggestions || this.showHarderSuggestions) {
          this.showSuggestions = true;
        }
      }
    }
  }

  private checkIfHarderSuggestions(answers: Answers): boolean {
    return answers.nrNo / answers.total < maxNoHarderPerc &&
           answers.nrYes / answers.total > minYesHarderPerc && !!this.harderBooks.length;
  }

  private checkIfEasierSuggestions(answers: Answers): boolean {
    return answers.nrYes / answers.total < maxYesEasierPerc &&
           answers.nrNo / answers.total > minNoEasierPerc && !!this.easierBooks.length;
  }

  private getWeightCoefficient(tpe: string, answers: Answers): number {
    if (tpe === 'harder') {
      // the more yes's the larger the coefficient
      return 1 + Math.max(0, answers.nrYes / answers.total - minYesHarderPerc) * 3.33;
    } else {
      // the more no's the larger the coefficient
      return 1 + Math.max(0, answers.nrNo / answers.total - minNoEasierPerc);
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}

