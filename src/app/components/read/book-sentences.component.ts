import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReadService } from '../../services/read.service';
import { UserService } from '../../services/user.service';
import { UtilsService } from '../../services/utils.service';
import { SharedService } from '../../services/shared.service';
import { ErrorService } from '../../services/error.service';
import { ModalConfirmComponent } from '../modals/modal-confirm.component';
import { zip, Subject, BehaviorSubject } from 'rxjs';
import { takeWhile, filter } from 'rxjs/operators';
import { UserBook, Bookmark,
         Book, Chapter, SentenceSteps, SentenceTranslation } from '../../models/book.model';

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
  chapterObservable: BehaviorSubject<Chapter>;
  interfaceLan = 'en';

  constructor(
    private route: ActivatedRoute,
    private readService: ReadService,
    private sharedService: SharedService,
    private userService: UserService,
    private utilsService: UtilsService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.interfaceLan = this.userService.user.main.lan;
    this.getBookId();
  }

  onExitReading(confirm: ModalConfirmComponent) {
    confirm.showModal = true;
  }

  onExitConfirmed(exitOk: boolean) {
    if (exitOk) {
      this.sharedService.changeExerciseMode(false);
      // this.readingStarted = false;
      this.log('Reading aborted');
      this.placeBookmark();
      this.processResults();
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
          zip(
            this.readService.fetchUserBook(this.interfaceLan, this.bookId),
            this.utilsService.fetchTranslations(this.interfaceLan, 'ReadComponent')
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
        if (chapter) {
          this.currentChapter = chapter;
          if (this.chapterObservable) {
            this.chapterObservable.next(chapter);
          } else {
            this.chapterObservable = new BehaviorSubject<Chapter>(chapter);
          }
          this.currentSentenceTotal = chapter.sentences.length;
          this.currentSentenceNr = 0;
          this.sentenceNrObservable.next(this.currentSentenceNr);
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
      this.interfaceLan,
      this.bookId,
      this.currentSentence)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
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

  private placeBookmark() {
    console.log('current step', this.currentStep, SentenceSteps.Answered);
    if (this.currentStep < SentenceSteps.Answered) {
      console.log('current sentence not answered, deduct one for bookmark', this.currentSentenceNr);
      this.currentSentenceNr--;
    }
    let isFinished = false;
    if (this.currentSentenceNr >= this.currentSentenceTotal) {
      isFinished = true;
    }
    console.log('place bookmark chapter', this.currentChapter);
    console.log('place bookmark sentencenr', this.currentSentenceNr, this.currentSentenceTotal);
    console.log('place bookmark finished', isFinished);
    const newBookmark: Bookmark = {
      chapterId: this.currentChapter._id,
      sentenceNr: this.currentSentenceNr,
      isFinished
    };
    this.readService
    .placeBookmark(this.bookId, newBookmark)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(bookmark => console.log('bookmarked'));
  }

  private processResults() {
    console.log('process results');
    this.currentStep = SentenceSteps.Results;
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
