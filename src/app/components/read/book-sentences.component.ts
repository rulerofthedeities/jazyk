import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReadService } from '../../services/read.service';
import { UserService } from '../../services/user.service';
import { UtilsService } from '../../services/utils.service';
import { SharedService } from '../../services/shared.service';
import { ErrorService } from '../../services/error.service';
import { ModalConfirmComponent } from '../modals/modal-confirm.component';
import { zip, BehaviorSubject, Subject } from 'rxjs';
import { takeWhile, filter } from 'rxjs/operators';
import { LearnSettings } from '../../models/user.model';
import { UserBook, Bookmark, SessionData,
         Book, Chapter, SentenceSteps, SentenceTranslation } from '../../models/book.model';

@Component({
  templateUrl: 'book-sentences.component.html',
  styleUrls: ['book-sentences.component.css']
})

export class BookSentencesComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private bookId: string;
  private saveFrequency = 3;
  settings: LearnSettings;
  text: Object = {};
  book: Book;
  isCountDown = false;
  currentChapter: Chapter;
  currentSentence: string;
  currentSentenceNr: number;
  currentSentenceTotal: number;
  currentStep = SentenceSteps.Question;
  currentAnswer: string;
  isBookRead = false;
  readingStarted = false;
  isLoading = false;
  isError = false;
  showMsg = false;
  steps = SentenceSteps;
  translations: SentenceTranslation[] = [];
  sentenceNrObservable: BehaviorSubject<number>;
  chapterObservable: BehaviorSubject<Chapter>;
  answersObservable: Subject<{answers: string, isResults: boolean}> = new Subject();
  nextSentenceObservable: Subject<boolean> = new Subject();
  userLanCode: string;
  sessionData: SessionData;
  startDate = new Date();
  @ViewChild(ModalConfirmComponent) confirm: ModalConfirmComponent;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private readService: ReadService,
    private sharedService: SharedService,
    private userService: UserService,
    private utilsService: UtilsService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.settings = this.userService.user.jazyk.learn;
    this.chapterObservable = new BehaviorSubject<Chapter>(null);
    this.sentenceNrObservable = new BehaviorSubject<number>(null);
    this.getBookId();
    this.observe();
  }

  onExitReading() {
    this.exitReading();
  }

  onExitConfirmed(exitOk: boolean) {
    if (exitOk) {
      this.log('Reading aborted');
      this.processResults(false);
    }
  }

  onBackToList() {
    this.router.navigate(['/read']);
  }

  onNextSentence() {
    this.nextSentence();
  }

  onAnswer(answer: string) {
    this.answer(answer);
  }

  onTranslationAdded(translationPoints: number) {
    this.sessionData.translations++;
    this.sessionData.points.translations += translationPoints;
  }

  onKeyPressed(key: string) {
    switch (key) {
      case 'Enter':
        if (this.currentStep === SentenceSteps.Translations) {
          this.nextSentence();
        }
        break;
      case 'Escape':
        if (this.currentStep < SentenceSteps.Results) {
          this.exitReading();
        }
        break;
      case 'Backspace':
      if (this.currentStep === SentenceSteps.Question) {
        this.answer('no');
      }
        break;
      case ' ':
        if (this.currentStep === SentenceSteps.Question) {
          this.answer('yes');
        }
        break;
    }
  }

  onCountDownFinished() {
    this.isCountDown = false;
    // this.sharedService.changeExerciseMode(true);
  }

  getBookReadMessage(title: string): string {
    if (title) {
      return this.text['AlreadyReadBook'].replace('%s', title);
    } else {
      return '';
    }
  }
  private exitReading() {
    let abortNow = false;
    if (this.isCountDown) {
      this.log('Countdown aborted');
      abortNow = true;
    } else {
      if (this.sessionData.answers) {
        this.confirm.showModal = true;
      } else {
        this.log('Reading aborted');
        abortNow = true;
      }
    }
    if (abortNow) {
      this.sharedService.changeExerciseMode(false);
      this.router.navigate(['/read']);
    }

  }

  private nextSentence() {
    this.nextSentenceObservable.next(true);
    this.getSentence();
    if (this.sessionData.answers.length % this.saveFrequency === 0) {
      this.placeBookmark(false);
      this.saveSessionData();
    }
  }

  private observe() {
    // New book started from suggestions?
    this.readService
    .readAnotherBook.subscribe(
      book => {
        if (this.currentStep === SentenceSteps.Results) {
          // Results - already saved
          this.startAnotherBook(book);
        } else {
          this.placeBookmark(false);
          this.saveSessionData(book);
        }
      }
    );
  }

  private startAnotherBook(book: Book) {
    this.bookId = book._id;
    this.book = book;
    this.userService.subscribeToBook(this.bookId, this.userLanCode);
    this.location.go('/read/book/' + this.bookId + '/' + this.userLanCode);
    this.log(`Start reading '${this.book.title}'`);
    this.isCountDown = false;
    this.currentChapter = null;
    this.currentSentence = null;
    this.currentSentenceNr = null;
    this.currentSentenceTotal = null;
    this.currentStep = null;
    this.currentAnswer = null;
    this.isBookRead = false;
    this.readingStarted = false;
    this.isLoading = false;
    this.isError = false;
    this.showMsg = false;
    this.sessionData = null;
    this.startDate = new Date();
    this.processNewBookId();
  }

  private answer(answer: string) {
    this.currentStep = SentenceSteps.Answered;
    this.currentAnswer = answer;
    this.sessionData.answers += answer.substr(0, 1);
    this.sessionData.points.words += this.getSentencePoints(this.currentSentence);
    switch (answer) {
      case 'yes':
        this.sessionData.nrYes++;
        break;
      case 'no':
        this.sessionData.nrNo++;
        break;
      case 'maybe':
        this.sessionData.nrMaybe++;
        break;
    }
    this.getSentenceTranslations(this.currentSentenceNr);
    this.answersObservable.next({answers: this.sessionData.answers, isResults: false});
  }

  private getSentencePoints(sentence: string): number {
    const words = sentence.split(' ');
    return words.length;
  }

  private getBookId() {
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.id))
    .subscribe(
      params => {
        this.bookId = params['id'];
        this.userLanCode = params['lan'];
        this.processNewBookId();
      }
    );
  }

  private processNewBookId() {
    if (this.bookId) {
      this.isLoading = true;
      zip(
        this.readService.fetchUserBook(this.userLanCode, this.bookId),
        this.utilsService.fetchTranslations(this.userService.user.main.lan, 'ReadComponent')
      )
      .pipe(
        takeWhile(() => this.componentActive))
      .subscribe(res => {
        this.text = this.utilsService.getTranslatedText(res[1]);
        const userBook = res[0];
        this.sessionData = {
          bookId: this.bookId,
          lanCode: this.userLanCode,
          answers: '',
          chapters: 0,
          translations: 0,
          nrYes: 0,
          nrNo: 0,
          nrMaybe: 0,
          points: {
            words: 0,
            translations: 0,
            finished: 0
          }
        };
        if (!userBook || (userBook && !userBook.bookmark)) {
          this.isCountDown = true;
        }
        this.getBook(this.bookId);
        this.findCurrentChapter(userBook);
      });
    }
  }

  private getBook(bookId: string) {
    this.readService
    .fetchBook(bookId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      book => {
        this.book = book;
        this.utilsService.setPageTitle(null, book.title);
      }
    );
  }

  private findCurrentChapter(userBook: UserBook) {
    if (userBook) {
      if (userBook.bookmark) {
        if (userBook.bookmark.isBookRead) {
          this.isBookRead = true;
          this.isError = true;
          this.showMsg = true;
        } else {
          this.getChapter(userBook.bookId, userBook.bookmark, 1);
        }
      } else {
        // no chapter: get first chapter
        this.getChapter(userBook.bookId, null, 1);
      }
    } else {
      // no userbook, subscribe and get first chapter
      this.userService.subscribeToBook(this.bookId, this.userLanCode);
      this.getChapter(this.bookId, null, 1);
    }
  }

  private getChapter(bookId: string, bookmark: Bookmark, sequence: number) {
    this.readService
    .fetchChapter(bookId, bookmark ? bookmark.chapterId : null, sequence)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      chapter => {
        this.isLoading = false;
        if (chapter) {
          this.currentChapter = chapter;
          this.emitChapter(chapter);
          this.currentSentenceTotal = chapter.sentences.length;
          this.currentSentenceNr = bookmark ? bookmark.sentenceNrChapter : 0;
          this.emitSentenceNr(this.currentSentenceNr);
          this.getSentence();
        } else {
          // chapter not found -> end of book?
          this.processResults(true);
        }
      }
    );
  }

  private getSentence() {
    const chapter = this.currentChapter,
          nr = this.currentSentenceNr;
    if (chapter.sentences[nr]) {
      this.currentStep = SentenceSteps.Question;
      const sentence = chapter.sentences[nr].text.trim();
      if (sentence) {
        this.currentSentence = sentence;
        this.currentSentenceNr++;
        this.emitSentenceNr(this.currentSentenceNr);
        this.checkReadingStarted(nr);
      }
    } else {
      // Chapter finished
      this.sessionData.chapters++;
      this.getChapter(this.bookId, null, this.currentChapter.sequence + 1);
    }
  }

  private emitSentenceNr(nr: number) {
    this.sentenceNrObservable.next(nr);
  }

  private emitChapter(chapter: Chapter) {
    this.chapterObservable.next(chapter);
  }

  private getSentenceTranslations(sentenceNr: number) {
    this.readService
    .fetchSentenceTranslations(
      this.userLanCode,
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

  private checkReadingStarted(sentenceNr: number) {
    if (this.sessionData.answers.length === 0) {
      const status = sentenceNr === 0 ? 'Start' : 'Continue';
      this.readingStarted = true;
      this.log(`${status} reading '${this.book.title}'`);
      this.sharedService.changeExerciseMode(true);
      this.errorService.clearError();
    }
  }

  private placeBookmark(isBookRead: boolean) {
    if (this.sessionData.answers) {
      let sentenceNrToBookmark = this.currentSentenceNr;
      if (this.currentStep < SentenceSteps.Answered) {
        sentenceNrToBookmark--;
      }
      let isRead = false;
      if (sentenceNrToBookmark >= this.currentSentenceTotal) {
        isRead = true;
      }
      const newBookmark: Bookmark = {
        chapterId: this.currentChapter._id,
        sentenceNrChapter: sentenceNrToBookmark,
        isChapterRead: isBookRead ? true : isRead,
        isBookRead
      };
      if (isBookRead) {
        this.sessionData.points.finished = Math.trunc(this.book.difficulty.nrOfWords * Math.log(this.book.difficulty.nrOfWords));
      }
      this.readService
      .placeBookmark(this.bookId, newBookmark, this.userLanCode)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(bookmark => {});
    }
  }

  private processResults(isBookRead: boolean) {
    this.sharedService.changeExerciseMode(false);
    this.placeBookmark(isBookRead); // must be before currentStep change
    this.saveSessionData();
    this.currentStep = SentenceSteps.Results;
    this.answersObservable.next({answers: this.sessionData.answers, isResults: true}); // Show suggestions also in results
  }

  private saveSessionData(book: Book = null) {
    if (this.sessionData.answers) {
      this.readService
      .saveSessionData(this.sessionData, this.startDate)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        id => {
          if (!this.sessionData._id && id) {
            this.sessionData._id = id;
          }
          if (book) {
            this.startAnotherBook(book);
          }
        }
      );
    }
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
