import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReadService } from '../../services/read.service';
import { UserService } from '../../services/user.service';
import { UtilsService } from '../../services/utils.service';
import { SharedService } from '../../services/shared.service';
import { ErrorService } from '../../services/error.service';
import { ModalConfirmComponent } from '../modals/modal-confirm.component';
import { zip, BehaviorSubject, Subject } from 'rxjs';
import { takeWhile, filter } from 'rxjs/operators';
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
  text: Object = {};
  book: Book;
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
  answersObservable: Subject<string>;
  userLanCode: string;
  sessionData: SessionData;
  startDate = new Date();
  @ViewChild(ModalConfirmComponent) confirm: ModalConfirmComponent;

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
    this.answersObservable = new Subject();
  }

  onExitReading(confirm: ModalConfirmComponent) {
    confirm.showModal = true;
  }

  onExitConfirmed(exitOk: boolean) {
    if (exitOk) {
      this.log('Reading aborted');
      this.processResults(false);
    }
  }

  onNextSentence() {
    this.getSentence();
    console.log('save session data?', this.sessionData.answers.length,
    this.saveFrequency, this.sessionData.answers.length % this.saveFrequency);
    if (this.sessionData.answers.length % this.saveFrequency === 0) {
      console.log('save session data', this.sessionData.answers.length);
      this.saveSessionData();
      this.placeBookmark(false);
    }
  }

  onAnswer(answer: string) {
    this.answer(answer);
  }

  onTranslationAdded() {
    this.sessionData.translations++;
  }

  onKeyPressed(key: string) {
    switch (key) {
      case 'Enter':
        if (this.currentStep === SentenceSteps.Translations) {
          this.getSentence();
        }
        break;
      case 'Escape':
        if (this.currentStep < SentenceSteps.Results) {
          this.confirm.showModal = true;
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

  getBookReadMessage(title: string): string {
    if (title) {
      return this.text['AlreadyReadBook'].replace('%s', title);
    } else {
      return '';
    }
  }

  private answer(answer: string) {
    this.currentStep = SentenceSteps.Answered;
    this.currentAnswer = answer;
    this.sessionData.answers += answer.substr(0, 1);
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
    this.getSentenceTranslations();
    this.answersObservable.next(this.sessionData.answers);
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
        console.log('user lan code', this.userLanCode);
        if (this.bookId) {
          this.isLoading = true;
          zip(
            this.readService.fetchUserBook(this.userLanCode, this.bookId),
            this.utilsService.fetchTranslations(this.userService.user.main.lan, 'ReadComponent')
          )
          .pipe(
            takeWhile(() => this.componentActive))
          .subscribe(res => {
            console.log('zip result', res);
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
              nrMaybe: 0
            };
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
      if (userBook.bookmark) {
        console.log(userBook.bookmark);
        if (userBook.bookmark.isBookRead) {
          this.isBookRead = true;
          this.isError = true;
          this.showMsg = true;
          console.log('BOOK READ BEFORE');
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
          this.currentSentenceNr = bookmark ? bookmark.sentenceNrChapter - 1 : 0;
          this.emitSentenceNr(this.currentSentenceNr);
          this.getSentence();
        } else {
          // chapter not found -> end of book?
          console.log('chapter not found - end of book');
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
      console.log('finished chapter', this.currentSentenceNr, chapter.sentences);
      this.sessionData.chapters++;
      this.getChapter(this.bookId, null, this.currentChapter.sequence + 1);
    }
  }

  private emitSentenceNr(nr: number) {
    if (this.sentenceNrObservable) {
      this.sentenceNrObservable.next(nr);
    } else {
      this.sentenceNrObservable = new BehaviorSubject<number>(nr);
    }
  }

  private emitChapter(chapter: Chapter) {
    if (this.chapterObservable) {
      this.chapterObservable.next(chapter);
    } else {
      this.chapterObservable = new BehaviorSubject<Chapter>(chapter);
    }
  }

  private getSentenceTranslations() {
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
      console.log(status + ' reading');
      this.sharedService.changeExerciseMode(true);
      this.errorService.clearError();
    }
  }

  private placeBookmark(isBookRead: boolean) {
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
    this.readService
    .placeBookmark(this.bookId, newBookmark, this.userLanCode)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(bookmark => console.log('bookmarked'));
  }

  private processResults(isBookRead: boolean) {
    console.log('changing exercise mode to false');
    this.sharedService.changeExerciseMode(false);
    this.currentStep = SentenceSteps.Results;
    this.saveSessionData();
    this.placeBookmark(isBookRead);
  }

  private saveSessionData() {
    if (this.sessionData.answers) {
      this.readService
      .saveSessionData(this.sessionData, this.startDate)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        id => {
          if (!this.sessionData._id && id) {
            this.sessionData._id = id;
          }
          console.log('Session data saved');
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
