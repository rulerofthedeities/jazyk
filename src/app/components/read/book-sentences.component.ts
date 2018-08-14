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
  isBookRead = false;
  readingStarted = false;
  isLoading = false;
  isError = false;
  showMsg = false;
  steps = SentenceSteps;
  translations: SentenceTranslation[] = [];
  sentenceNrObservable: BehaviorSubject<number>;
  chapterObservable: BehaviorSubject<Chapter>;
  interfaceLan = 'en';
  sessionData: SessionData;
  chapterData: ChapterData;

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
      this.log('Reading aborted');
      this.placeBookmark();
      this.processResults();
    }
  }

  onNextSentence() {
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

  getBookReadMessage(title: string): string {
    if (title) {
      return this.text['AlreadyReadBook'].replace('%s', title);
    } else {
      return '';
    }
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
      if (userBook.bookmark) {
        console.log(userBook.bookmark);
        if (userBook.bookmark.isBookRead) {
          this.isBookRead = true;
          this.isError = true;
          this.showMsg = true;
          console.log('BOOK READ');
        } else {
          // TODO: start with this chapter; if at the end; go to next chapter
          this.getChapter(userBook.bookId, userBook.bookmark, 1);
        }
      } else {
        // no chapter: get first chapter
        this.getChapter(userBook.bookId, null, 1);
      }
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
          console.log('chapter not found - end of book');
          this.setBookmarkRead();
          this.currentStep = SentenceSteps.Results;
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
        this.emitSentenceNr(this.currentSentenceNr);
        if (nr === 0) {
          this.startReading(true);
        } else {
          this.startReading(false);
        }
      }
    } else {
      // Chapter finished
      console.log('finished chapter', this.currentSentenceNr, chapter.sentences);
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

  private startReading(isNew: boolean) {
    const status = isNew ? 'Start' : 'Continue';
    this.readingStarted = true;
    this.log(`${status} reading '${this.book.title}'`);
    this.sharedService.changeExerciseMode(true);
    this.errorService.clearError();
  }

  private placeBookmark() {
    if (this.currentStep < SentenceSteps.Answered) {
      this.currentSentenceNr--;
    }
    let isRead = false;
    if (this.currentSentenceNr >= this.currentSentenceTotal) {
      isRead = true;
    }
    const newBookmark: Bookmark = {
      chapterId: this.currentChapter._id,
      sentenceNrChapter: this.currentSentenceNr,
      isChapterRead: isRead
    };
    this.readService
    .placeBookmark(this.bookId, newBookmark)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(bookmark => console.log('bookmarked'));
  }

  private setBookmarkRead() {
    const newBookmark: Bookmark = {
      chapterId: this.currentChapter._id,
      sentenceNrChapter: this.currentSentenceNr,
      sentenceNrBook: this.book.difficulty.nrOfSentences,
      isChapterRead: true,
      isBookRead: true
    };
    this.readService
    .setBookmarkRead(this.bookId, newBookmark)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(bookmark => console.log('set book as read'));
  }

  private processResults() {
    this.sharedService.changeExerciseMode(false);
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