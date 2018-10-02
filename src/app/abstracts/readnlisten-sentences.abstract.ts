import { OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Location, PlatformLocation } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReadService } from '../services/read.service';
import { ReadnListenService } from '../services/readnlisten.service';
import { UserService } from '../services/user.service';
import { SharedService } from '../services/shared.service';
import { ErrorService } from '../services/error.service';
import { SessionData, UserBook, Bookmark, Book, Chapter,
         Sentence, SentenceSteps } from '../models/book.model';
import { ReadSettings } from '../models/user.model';
import { ModalConfirmComponent } from '../components/modals/modal-confirm.component';
import { takeWhile, filter } from 'rxjs/operators';
import { zip, BehaviorSubject, Subject } from 'rxjs';

export abstract class ReadnListenSentencesComponent implements OnInit, OnDestroy {
  protected componentActive = true;
  protected bookId: string;
  private saveFrequency = 3;
  text: Object = {};
  settings: ReadSettings;
  book: Book;
  sessionData: SessionData;
  currentChapter: Chapter;
  currentSentenceTotal: number;
  currentSentenceNr: number;
  currentSentence: Sentence;
  currentSentenceTxt: string;
  currentAnswer: string;
  currentStep = SentenceSteps.Question;
  steps = SentenceSteps;
  bookType = 'read'; // read or listen
  userLanCode: string;
  userId: string;
  msg: string;
  isTest = false;
  isLoading = false;
  isCountDown = false;
  isBookRead = false;
  isError = false;
  showReadMsg = false;
  readingStarted = false;
  nextSentenceObservable: Subject<string> = new Subject();
  sentenceNrObservable: BehaviorSubject<number>;
  chapterObservable: BehaviorSubject<Chapter>;
  answersObservable: Subject<{answers: string, isResults: boolean}> = new Subject();
  @ViewChild(ModalConfirmComponent) confirm: ModalConfirmComponent;

  constructor(
    protected route: ActivatedRoute,
    protected router: Router,
    protected location: Location,
    protected platformLocation: PlatformLocation,
    protected readService: ReadService,
    protected readnListenService: ReadnListenService,
    protected sharedService: SharedService,
    protected userService: UserService,
    protected errorService: ErrorService
  ) {}

  ngOnInit() {
    console.log('abstract init');
    this.userId = this.userService.user._id.toString();
    this.settings = this.userService.user.jazyk.read;
    this.chapterObservable = new BehaviorSubject<Chapter>(null);
    this.sentenceNrObservable = new BehaviorSubject<number>(null);
    this.getBookType(); // read or listen
    this.getBookId();
    console.log('booktype', this.bookType);
    console.log('is test', this.isTest);
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

  onKeyPressed(key: string) {
    switch (key) {
      case 'Escape':
        if (this.currentStep < SentenceSteps.Results) {
          this.exitReading();
        }
      break;
    }
  }

  onCountDownFinished() {
    this.isCountDown = false;
  }

  onTranslationAdded(translationPoints: number) {
    this.sessionData.translations++;
    this.sessionData.points.translations += Math.round(translationPoints * this.getScoreMultiplier()) || 0;
  }

  onGoToNextSentence() {
    // Enter pressed in translation
    this.nextSentence();
  }

  onNextSentence() {
    this.nextSentence();
  }

  onBackToList() {
    this.router.navigate(['/' + this.bookType]);
  }

  private nextSentence() {
    this.getSentence();
    if (this.sessionData.answers.length % this.saveFrequency === 0 || this.sessionData.answers.length === 1) {
      this.placeBookmark(false);
      this.saveSessionData();
    }
  }

  private getBookType() {
    // read or listen
    this.route
    .data
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      this.bookType = data.tpe;
      this.isTest = !!data.test;
    });
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

  protected processNewBookId() {
    if (this.bookId) {
      this.isLoading = true;
      zip(
        this.readnListenService.fetchUserBook(this.userLanCode, this.bookId, this.isTest),
        this.sharedService.fetchTranslations(this.userService.user.main.lan, 'ReadComponent')
      )
      .pipe(
        takeWhile(() => this.componentActive))
      .subscribe(res => {
        this.text = this.sharedService.getTranslatedText(res[1]);
        const userBook = res[0];
        this.sessionData = {
          bookId: this.bookId,
          lanCode: this.userLanCode,
          bookType: this.bookType,
          isTest: this.isTest,
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
          },
          resultData: {
            isFinished: false,
            totalBookSentences: null
          }
        };
        if (!userBook || (userBook && !userBook.bookmark)) {
          this.isCountDown = true;
        }
        this.findCurrentChapter(userBook);
      });
    }
  }

  private findCurrentChapter(userBook: UserBook) {
    if (userBook) {
      if (userBook.bookmark) {
        if (userBook.bookmark.isBookRead) {
          this.isBookRead = true;
          this.isError = true;
          this.showReadMsg = true;
        } else {
          this.getBookAndChapter(userBook.bookId, userBook.bookmark, 1);
        }
      } else {
        // no chapter: get first chapter
        this.getBookAndChapter(userBook.bookId, null, 1);
      }
    } else {
      // no userbook, subscribe and get first chapter
      this.userService.subscribeToBook(this.bookId, this.userLanCode, this.bookType);
      this.getBookAndChapter(this.bookId, null, 1);
    }
  }

  private getBookAndChapter(bookId: string, bookmark: Bookmark, sequence: number) {
    zip(
      this.readnListenService.fetchBook(bookId, this.bookType),
      this.readnListenService.fetchChapter(bookId, this.bookType, bookmark ? bookmark.chapterId : null, sequence)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      console.log('DATA', data);
      this.processBook(data[0]);
      this.processChapter(data[1], bookmark);
      this.isLoading = false;
    });
  }

  private processBook(book: Book) {
    if (!book) {
      this.isError = true;
      this.msg = this.text['ItemNotAvailable'].replace('%s', `'${this.bookId}'`);
    } else {
      this.book = book;
      this.sessionData.resultData.totalBookSentences = this.book.difficulty.nrOfSentences;
      this.sharedService.setPageTitle(null, book.title);
    }
  }

  private processChapter(chapter: Chapter, bookmark: Bookmark) {
    if (chapter) {
      this.currentChapter = chapter;
      const activeSentences = chapter.sentences.filter(s => !s.isDisabled);
      console.log('active sentences', activeSentences);
      activeSentences.sort(
        (a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0)
      );
      chapter.activeSentences = activeSentences;
      this.emitChapter(chapter);
      console.log('current sentences', chapter.activeSentences);
      this.currentSentenceTotal = activeSentences.length;
      this.currentSentenceNr = bookmark ? bookmark.sentenceNrChapter : 0;
      console.log('current sentence nr', this.currentSentenceNr);
      this.emitSentenceNr(this.currentSentenceNr);
      this.getSentence();
    } else {
      // chapter not found -> end of book
      console.log('no chapter, end of book');
      this.sessionData.resultData.isFinished = true;
      this.processResults(true);
    }
  }

  protected getSentence() {
    const nr = this.currentSentenceNr,
          sentences = this.currentChapter.activeSentences;
    console.log('nr', sentences[nr]);
    let sentenceOk = false;
    if (sentences[nr]) {
      this.currentStep = SentenceSteps.Question;
      const sentenceTxt = sentences[nr].text ? sentences[nr].text.trim() : null;
      console.log('sentenceTxt', sentenceTxt);
      if (sentenceTxt) {
        this.currentSentence = sentences[nr];
        this.currentSentenceTxt = sentenceTxt;
        this.currentSentenceNr++;
        this.emitSentenceNr(this.currentSentenceNr);
        this.nextSentenceObservable.next(sentenceTxt);
        this.checkReadingStarted(nr);
        sentenceOk = true;
      }
    }
    if (!sentenceOk) {
      // Chapter finished
      console.log('chapter finished');
      this.sessionData.chapters++;
      this.getChapter(this.bookId, null, this.currentChapter.sequence + 1);
    }
  }

  private getChapter(bookId: string, bookmark: Bookmark, sequence: number) {
    this.readService
    .fetchChapter(bookId, bookmark ? bookmark.chapterId : null, sequence)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      chapter => {
        console.log('fetched chapter', chapter);
        this.processChapter(chapter, bookmark);
      }
    );
  }

  private processResults(isBookRead: boolean) {
    this.sharedService.changeExerciseMode(false);
    this.placeBookmark(isBookRead); // must be before currentStep change
    this.saveSessionData();
    this.currentStep = SentenceSteps.Results;
    this.readingStarted = true; // in case nothing was done, otherwise it shows loading
    this.answersObservable.next({answers: this.sessionData.answers, isResults: true}); // Show suggestions also in results
  }

  private checkReadingStarted(sentenceNr: number) {
    if (this.sessionData.answers.length === 0) {
      const status = sentenceNr === 0 ? 'Start' : 'Continue';
      if (this.book) {
        this.readingStarted = true;
        this.log(`${status} reading '${this.book.title}'`);
        this.sharedService.changeExerciseMode(true);
        this.errorService.clearError();
      }
    }
  }

  protected placeBookmark(isBookRead: boolean) {
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
        this.sessionData.points.finished =
          Math.round(this.book.difficulty.nrOfWords *
          Math.log(this.book.difficulty.nrOfWords) *
          this.getScoreMultiplier()) || 0;
      }
      console.log('place bookmark', newBookmark);
      this.readnListenService
      .placeBookmark(this.bookId, newBookmark, this.userLanCode, this.bookType, this.isTest)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(bookmark => {console.log('bookmarked', bookmark); });
    }
  }

  protected saveSessionData(book: Book = null) {
    if (this.sessionData.answers) {
      this.readnListenService
      .saveSessionData(this.sessionData)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        (sessionData: SessionData) => {
          if (!this.sessionData._id && sessionData._id) {
            this.sessionData._id = sessionData._id;
            this.sessionData.dt = sessionData.dt;
          }
          if (book) {
            this.startAnotherBook(book);
          }
        }
      );
    }
  }

  protected exitReading() {
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
      this.router.navigate(['/' + this.bookType]);
    }
  }

  private emitChapter(chapter: Chapter) {
    this.chapterObservable.next(chapter);
  }

  private emitSentenceNr(nr: number) {
    this.sentenceNrObservable.next(nr);
  }

  protected getScoreMultiplier(): number {
    return 1.5 + this.book.difficulty.avgWordScore / 1000;
  }

  protected log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'ReadComponent'
    });
  }

  protected startAnotherBook(book: Book) {
    // TODO
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
