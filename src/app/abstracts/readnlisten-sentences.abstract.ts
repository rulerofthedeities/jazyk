import { OnDestroy, OnInit, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { Location, PlatformLocation } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReadnListenService } from '../services/readnlisten.service';
import { UserService } from '../services/user.service';
import { SharedService } from '../services/shared.service';
import { ErrorService } from '../services/error.service';
import { SessionData, UserBook, Bookmark, Book, Chapter,
         Sentence, SentenceSteps } from '../models/book.model';
import { ReadSettings } from '../models/user.model';
import { ModalConfirmComponent } from '../components/modals/modal-confirm.component';
import { BookTranslationComponent } from '../components/readnlisten/book-translation.component';
import { takeWhile, filter } from 'rxjs/operators';
import { zip, BehaviorSubject, Subject } from 'rxjs';

export abstract class ReadnListenSentencesComponent implements OnInit, OnDestroy {
  protected componentActive = true;
  protected bookId: string;
  private saveFrequency = 2; // Save every two answers
  private repeatCount = 0;
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
  isRepeat = false;
  showReadMsg = false;
  readingStarted = false;
  nextSentenceObservable: Subject<string> = new Subject();
  sentenceNrObservable: BehaviorSubject<number>;
  chapterObservable: BehaviorSubject<Chapter>;
  answersObservable: Subject<{answers: string, isResults: boolean}> = new Subject();
  @ViewChildren(ModalConfirmComponent) confirm:  QueryList<ModalConfirmComponent>;
  @ViewChild(BookTranslationComponent) translationsElement: BookTranslationComponent;

  constructor(
    protected route: ActivatedRoute,
    protected router: Router,
    protected location: Location,
    protected platformLocation: PlatformLocation,
    protected readnListenService: ReadnListenService,
    protected sharedService: SharedService,
    protected userService: UserService,
    protected errorService: ErrorService
  ) {}

  ngOnInit() {
    this.observe();
    this.userId = this.userService.user._id.toString();
    this.settings = this.userService.user.jazyk.read;
    this.chapterObservable = new BehaviorSubject<Chapter>(null);
    this.sentenceNrObservable = new BehaviorSubject<number>(null);
    this.getBookType(); // read or listen
    this.getBookId();
  }

  onExitReading() {
    this.exitReading();
  }

  onExitConfirmed(exitOk: boolean) {
    if (exitOk) {
      this.log('Reading aborted');
      this.sharedService.stopAudio();
      // Check if book is finished - in case abort right before end
      if (this.currentSentenceNr >= this.currentSentenceTotal) {
        this.sessionData.chapters++;
        this.readnListenService
        .fetchChapter(this.book._id, this.bookType, null, this.currentChapter.sequence + 1)
        .pipe(takeWhile(() => this.componentActive))
        .subscribe(
          chapter => {
            if (!chapter) {
              // Quit book right at the finish!
              this.sessionData.resultData.isFinished = true;
              this.processResults(true);
            } else {
              // There is another chapter
              this.processResults(false);
            }
          }
        );
      } else {
        this.processResults(false);
      }
    }
  }

  onSetFinished(isFinished: boolean) {
    // Book is finished but flag is not set in bookmark (user closed page right before results)
    this.sessionData.points.finished = this.getPointsFinished();
    this.readnListenService
    .setFinished(this.bookId, this.userLanCode, this.bookType, this.isTest, this.sessionData.points.finished)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      userBook => {}
    );
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
    // Check if there is a translation not saved yet
    if (this.translationsElement && this.translationsElement.checkIfTranslationPending()) {
      const confirm = this.confirm.find(c => c.name === 'skiptranslation');
      if (confirm) {
        confirm.showModal = true;
      }
    } else {
      this.nextSentence();
    }
  }

  onIgnoreTranslationConfirmed(exitOk: boolean) {
    if (exitOk) {
      this.nextSentence();
    }
  }

  onBackToList() {
    this.router.navigate(['/' + this.bookType]);
  }

  private nextSentence() {
    this.sharedService.stopAudio();
    this.getSentence();
  }

  protected saveBookmarkAndSession() {
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
          repeatCount: userBook.repeatCount ? userBook.repeatCount : undefined,
          answers: '',
          chapters: 0,
          translations: 0,
          nrYes: 0,
          nrNo: 0,
          nrMaybe: 0,
          points: {
            words: 0,
            translations: 0,
            test: 0,
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

  protected getSentencePoints(sentence: string): number {
    const words = sentence.split(' ');
    return words ? Math.round(words.length * this.getScoreMultiplier() * this.getRepeatMultiplier() * 3.2) : 0;
  }

  private findCurrentChapter(userBook: UserBook) {
    if (userBook) {
      const repeatCount = userBook.repeatCount || 0;
      if (repeatCount > 0) {
        this.isRepeat = true;
        this.repeatCount = repeatCount;
      }
      if (userBook.bookmark) {
        if (userBook.bookmark.isBookRead) {
          this.isBookRead = true;
          this.isError = true;
          this.showReadMsg = true;
          this.setBookFinishedMessage();
        } else {
          this.getBookAndChapter(userBook.bookId, userBook.bookmark, 1);
        }
      } else {
        // no chapter: get first chapter
        this.getBookAndChapter(userBook.bookId, null, 1);
      }
    } else {
      // no userbook, subscribe and get first chapter
      this.readnListenService
      .subscribeToBook(this.bookId, this.userLanCode, this.bookType, this.isTest)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        newUserBook => {
          this.getBookAndChapter(this.bookId, null, 1);
      });
    }
  }

  private getBookAndChapter(bookId: string, bookmark: Bookmark, sequence: number) {
    zip(
      this.readnListenService.fetchBook(bookId, this.bookType),
      this.readnListenService.fetchChapter(bookId, this.bookType, bookmark ? bookmark.chapterId : null, sequence)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
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
      if (this.bookType === 'listen') {
        activeSentences.sort(
          (a, b) => (a.sequence > b.sequence) ? 1 : ((b.sequence > a.sequence) ? -1 : 0)
        );
      }
      chapter.activeSentences = activeSentences;
      this.emitChapter(chapter);
      this.currentSentenceTotal = activeSentences.length;
      this.currentSentenceNr = bookmark ? bookmark.sentenceNrChapter : 0;
      this.emitSentenceNr(this.currentSentenceNr);
      this.getSentence();
    } else {
      // chapter not found -> end of book
      this.sessionData.resultData.isFinished = true;
      this.processResults(true);
    }
  }

  protected getSentence() {
    const nr = this.currentSentenceNr,
          sentences = this.currentChapter.activeSentences;
    let sentenceOk = false;
    if (sentences[nr]) {
      this.currentStep = SentenceSteps.Question;
      const sentenceTxt = sentences[nr].text ? sentences[nr].text.trim() : null;
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
      this.sessionData.chapters++;
      this.getChapter(this.bookId, null, this.currentChapter.sequence + 1);
    }
  }

  private getChapter(bookId: string, bookmark: Bookmark, sequence: number) {
    this.readnListenService
    .fetchChapter(bookId, this.bookType, bookmark ? bookmark.chapterId : null, sequence)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      chapter => {
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
        this.sessionData.points.finished = this.getPointsFinished();
      }
      this.readnListenService
      .placeBookmark(this.bookId, newBookmark, this.userLanCode, this.bookType, this.isTest)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(bookmark => {});
    }
  }

  private getPointsFinished(): number {
    return Math.round(this.book.difficulty.nrOfWords *
          Math.log(this.book.difficulty.nrOfWords) *
          this.getScoreMultiplier() * this.getRepeatMultiplier() * 0.9) || 0;
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

  protected observe() {
    // New book started from suggestions?
    this.readnListenService
    .readAnotherBook
    .subscribe(
      book => {
        if (this.currentStep === SentenceSteps.Results) {
          // Results - already saved
          this.startAnotherBook(book);
        } else {
          if (this.currentSentenceNr >= this.currentSentenceTotal) {
            // Check if finished
            this.readnListenService
            .fetchChapter(this.book._id, this.bookType, null, this.currentChapter.sequence + 1)
            .pipe(takeWhile(() => this.componentActive))
            .subscribe(
              chapter => {
                if (!chapter) {
                  // Quit book right at the finish!
                  this.placeBookmark(true);
                }
                this.saveSessionData(book);
              }
            );
          } else {
            this.placeBookmark(false);
            this.saveSessionData(book);
          }
        }
      }
    );
    // If back button, show header
    this.platformLocation.onPopState(() => {
      this.sharedService.changeExerciseMode(false);
    });
  }

  protected exitReading() {
    let abortNow = false;
    if (this.isCountDown) {
      this.log('Countdown aborted');
      abortNow = true;
    } else {
      if (this.sessionData.answers) {
        const confirm = this.confirm.find(c => c.name === 'exit');
        if (confirm) {
          confirm.showModal = true;
        }
      } else {
        this.log('Reading aborted');
        abortNow = true;
      }
    }
    if (abortNow) {
      this.sharedService.changeExerciseMode(false);
      this.sharedService.stopAudio();
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
    return 1.1 + this.book.difficulty.avgWordScore / 1000;
  }

  private getRepeatMultiplier(): number {
    // The more repeats you do, the less points you get
    switch (this.repeatCount) {
      case 0: return 1;
      case 1: return 0.95;
      case 2: return 0.8;
      case 3: return 0.7;
      case 4: return 0.55;
      case 5: return 0.35;
      default: return 0.25;
    }
  }

  protected log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'ReadComponent'
    });
  }


  protected startAnotherBook(book: Book) {
    this.bookId = book._id;
    this.book = book;
    this.readnListenService
    .subscribeToBook(this.bookId, this.userLanCode, this.bookType, this.isTest)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      userBook => {
        console.log('go to new book');
        this.location.go('/' + this.bookType + '/book/' + this.bookId + '/' + this.userLanCode + (this.isTest ? '/test' : ''));
        this.log(`Start ${this.bookType === 'listen' ? 'listening' : 'reading'} ${this.isTest ? 'test ' : '' }'${this.book.title}'`);
        this.isCountDown = false;
        this.currentChapter = null;
        this.currentSentence = null;
        this.currentSentenceTxt = null;
        this.currentSentenceNr = null;
        this.currentSentenceTotal = null;
        this.currentStep = null;
        this.currentAnswer = null;
        this.isBookRead = false;
        this.readingStarted = false;
        this.isLoading = false;
        this.isError = false;
        this.showReadMsg = false;
        this.sessionData = null;
        this.msg = null;
        this.processNewBookId();
    });
  }

  private setBookFinishedMessage() {
    // Get title of book for error message!
    this.readnListenService.
    fetchBook(this.bookId, this.bookType)
    .subscribe(
      book => {
        if (book) {
          this.msg = this.text[this.bookType === 'listen' ? 'AlreadyListenedBook' : 'AlreadyReadBook'].replace('%s', book.title);
        } else {
          this.msg = this.text[this.bookType === 'listen' ? 'AlreadyListenedBook' : 'AlreadyReadBook'].replace('%s', 'id:' + this.bookId);
        }
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
