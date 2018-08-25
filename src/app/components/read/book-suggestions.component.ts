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
    private readService: ReadService
  ) {}

  ngOnInit() {
    this.getBooks();
    this.observe();
  }

  private getBooks() {
    zip(
      this.readService.fetchPublishedBooks(this.book.lanCode, 'difficulty1'),
      this.readService.fetchUserBooks(this.userLanCode),
      this.readService.fetchPreviousAnswers(this.book._id, this.userLanCode)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(res => {
      this.books = res[0];
      this.finishedBooks = this.removeFinishedBooks(res[1]);
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
        this.processAnswers(answers.answers);
        this.isResults = answers.isResults;
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

  private removeFinishedBooks(userBooks: UserBook[]) {
    // Remove finished books from list
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
    const weightCoefficientHarder = this.getWeightCoefficient('harder', answers),
          weightCoefficientEasier = this.getWeightCoefficient('easier', answers);
    // console.log('weight coefficients', weightCoefficientHarder, weightCoefficientEasier);
    if (this.finishedBooks) {
      const weightDeltaLargeRange = [40, 80], // Min diff for easier / harder books unless there are none
            weightDeltaLSmallRange = [0, 40], // Only used if Large yields no results
            currentWeight = this.book.difficulty.weight;
      let harderBooks: Book[] = [],
          easierBooks: Book[] = [];
      this.finishedBooks.forEach(finishedBook => {
        this.books = this.books.filter(book => book._id !== finishedBook.bookId);
      });
      if (this.books.length > 0) {
        // Find easier / harder books
        harderBooks = this.books.filter(book =>
          book.difficulty.weight > currentWeight + weightDeltaLargeRange[0] * weightCoefficientHarder &&
          book.difficulty.weight < currentWeight + weightDeltaLargeRange[1] * weightCoefficientHarder
        );
        easierBooks = this.books.filter(book =>
          book.difficulty.weight < currentWeight - weightDeltaLargeRange[0] * weightCoefficientEasier &&
          book.difficulty.weight > currentWeight - weightDeltaLargeRange[1] * weightCoefficientEasier
        );
        // If none found, use smaller delta
        if (harderBooks.length < 1) {
          harderBooks = this.books.filter(book =>
            book.difficulty.weight > currentWeight + weightDeltaLSmallRange[0] &&
            book.difficulty.weight < currentWeight + weightDeltaLSmallRange[1] * weightCoefficientHarder
          );
        }
        if (easierBooks.length < 1) {
          easierBooks = this.books.filter(book =>
            book.difficulty.weight < currentWeight - weightDeltaLSmallRange[0] &&
            book.difficulty.weight > currentWeight - weightDeltaLSmallRange[1] * weightCoefficientEasier
          );
        }
        easierBooks = this.readService.shuffle(easierBooks).slice(0, 3),
        harderBooks = this.readService.shuffle(harderBooks).slice(0, 3);
        let suggestedBooks = easierBooks.concat(harderBooks);

        const showHarderSuggestions = this.checkIfHarderSuggestions(answers, !!harderBooks.length),
              showEasierSuggestions = this.checkIfEasierSuggestions(answers, !!easierBooks.length);
        if (showEasierSuggestions) {
          if (showHarderSuggestions) {
            suggestedBooks = easierBooks.concat(harderBooks);
          } else {
            suggestedBooks = easierBooks;
          }
        } else {
          suggestedBooks = harderBooks;
        }
        if (suggestedBooks) {
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

  private checkIfHarderSuggestions(answers: Answers, hasHarderBooks: boolean): boolean {
    return answers.nrNo / answers.total < maxNoHarderPerc &&
           answers.nrYes / answers.total > minYesHarderPerc && hasHarderBooks;
  }

  private checkIfEasierSuggestions(answers: Answers, hasEasierBooks: boolean): boolean {
    return answers.nrYes / answers.total < maxYesEasierPerc &&
           answers.nrNo / answers.total > minNoEasierPerc && hasEasierBooks;
  }

  private getWeightCoefficient(tpe: string, answers: Answers): number {
    if (tpe === 'harder') {
      // the more yes's the larger the coefficient
      return 1 + Math.max(0, answers.nrYes / answers.total - minYesHarderPerc) * 2.5;
    } else {
      // the more no's the larger the coefficient
      return 1 + Math.max(0, answers.nrNo / answers.total - minNoEasierPerc);
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}

