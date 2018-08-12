import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReadService } from '../../services/read.service';
import { UserService } from '../../services/user.service';
import { UtilsService } from '../../services/utils.service';
import { SharedService } from '../../services/shared.service';
import { ErrorService } from '../../services/error.service';
import { ModalConfirmComponent } from '../modals/modal-confirm.component';
import { zip, Subject } from 'rxjs';
import { takeWhile, filter } from 'rxjs/operators';
import { UserBook, Book, Chapter, SentenceSteps, SentenceTranslation } from '../../models/book.model';

@Component({
  templateUrl: 'book-sentences.component.html',
  styleUrls: ['book-sentences.component.css']
})

export class BookSentencesComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private bookId: string;
  text: Object = {};
  book: Book;
  currentChapter: Chapter;
  currentSentence: string;
  currentSentenceNr: number;
  currentSentenceTotal: number;
  currentStep = SentenceSteps.Question;
  currentAnswer: string;
  readingStarted = false;
  isLoading = false;
  steps = SentenceSteps;
  translations: SentenceTranslation[] = [];
  sentenceNrObservable: Subject<number> = new Subject<number>();

  constructor(
    private route: ActivatedRoute,
    private readService: ReadService,
    private sharedService: SharedService,
    private userService: UserService,
    private utilsService: UtilsService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getBookId();
  }

  onExitReading(confirm: ModalConfirmComponent) {
    confirm.showModal = true;
  }

  onExitConfirmed(exitOk: boolean) {
    if (exitOk) {
      this.sharedService.changeExerciseMode(false);
      this.readingStarted = false;
      this.log('Reading aborted');
    }
  }

  onNextSentence() {
    // this.currentSentenceNr++;
    this.currentStep = SentenceSteps.Question;
    this.getSentence();
  }

  onAnswer(answer: string) {
    console.log('answer', answer);
    this.currentStep = SentenceSteps.Answered;
    this.currentAnswer = answer;
    switch (answer) {
      case 'yes': break;
      case 'no': break;
      case 'maybe': break;
    }
    this.getSentenceTranslations();
  }

  private getBookId() {
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.id))
    .subscribe(
      params => {
        this.bookId = params['id'];
        if (this.bookId) {
          this.isLoading = true;
          const interfaceLan = this.userService.user.main.lan;
          zip(
            this.readService.fetchUserBook(interfaceLan, this.bookId),
            this.utilsService.fetchTranslations(interfaceLan, 'ReadComponent')
          )
          .pipe(
            takeWhile(() => this.componentActive))
          .subscribe(res => {
            console.log('zip result', res);
            this.text = this.utilsService.getTranslatedText(res[1]);
            const userBook = res[0];
            this.getBook(this.bookId);
            this.findCurrentChapter(userBook);
          });
        }
      }
    );
  }

  private getBook(bookId: string) {
    this.readService
    .fetchBook(bookId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      book => {
        this.book = book;
        console.log('book', book);
        this.utilsService.setPageTitle(null, book.title);
      }
    );
  }

  private findCurrentChapter(userBook: UserBook) {
    if (userBook) {
      const hasChapter = false;
      // TODO: get user progress with current chapter
      if (hasChapter) {
        // TODO: start with this chapter; if at the end; go to next chapter
      } else {
        // no chapter: get first chapter
        this.getChapter(userBook.bookId, 1);
      }
    }
  }

  private getChapter(bookId: string, sequence: number) {
    this.readService
    .fetchChapter(bookId, sequence)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      chapter => {
        this.isLoading = false;
        console.log('chapter', chapter);
        if (chapter) {
          this.currentChapter = chapter;
          this.currentSentenceTotal = chapter.sentences.length;
          this.currentSentenceNr = 0;
          this.getSentence();
        } else {
          // chapter not found -> end of book?
        }
      }
    );
  }

  private getSentence() {
    const chapter = this.currentChapter,
          nr = this.currentSentenceNr;
    if (chapter.sentences[nr]) {
      const sentence = chapter.sentences[nr].text.trim();
      if (sentence) {
        this.currentSentence = sentence;
        this.currentSentenceNr++;
        this.sentenceNrObservable.next(this.currentSentenceNr);
        if (nr === 0) {
          this.startReading();
        }
      }
    }
  }

  private getSentenceTranslations() {
    this.readService
    .fetchSentenceTranslations(
      this.userService.user.main.lan,
      this.bookId,
      this.currentSentence)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        console.log('translations', translations);
        this.translations = translations;
        this.currentStep = SentenceSteps.Translations;

      }
    );
  }

  private startReading() {
    this.readingStarted = true;
    this.log(`Start reading '${this.book.title}'`);
    this.sharedService.changeExerciseMode(true);
    this.errorService.clearError();
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'ReadComponent'
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
