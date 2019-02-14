import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { RevisionService } from '../../services/revision.service';
import { SharedService } from '../../services/shared.service';
import { takeWhile, filter } from 'rxjs/operators';
import { zip } from 'rxjs';
import { Book, UserBook, Chapter, SessionData, RevisionTranslations } from 'app/models/book.model';

@Component({
  templateUrl: 'book-revision.component.html',
  styleUrls: ['../readnlisten/book-context.component.css', 'book-revision.component.css']
})

export class BookRevisionComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object;
  book: Book;
  userBook: UserBook;
  isLoading = false;
  bookType: string;
  bookId: string;
  userLanCode: string;
  msg: string;
  chapters: Chapter[];
  currentChapter: Chapter;
  hasChapters = false;
  sessionData: SessionData[];
  translations: RevisionTranslations[];

  constructor(
    private route: ActivatedRoute,
    protected userService: UserService,
    protected sharedService: SharedService,
    protected revisionService: RevisionService,
    protected readnListenService: ReadnListenService
  ) {}

  ngOnInit() {
    this.getBookType();
    this.getDependables(this.userService.user.main.lan);
  }


  private getBookType() {
    // read or listen
    this.route
    .data
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      this.bookType = data.tpe;
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

  private processNewBookId() {
    if (this.bookId && this.bookId.length === 24) {
      this.isLoading = true;
      zip(
        this.readnListenService.fetchBook(this.bookId, this.bookType),
        this.readnListenService.fetchUserBook(this.userLanCode, this.bookId, false),
        this.readnListenService.fetchChapterHeaders(this.bookId, this.bookType)
      )
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(res => {
        this.book = res[0];
        this.userBook = res[1];
        this.chapters = res[2];
        this.loadSessionsTranslations();

        console.log('book', this.book);
        console.log('user book', this.userBook);
        console.log('chapters', this.chapters);
      });
    } else {
      this.msg = this.text['InvalidBookId'];
    }
  }

  private loadSessionsTranslations() {
    zip(
      this.revisionService.fetchTranslations(this.bookId, this.book.lanCode, this.userLanCode),
      this.revisionService.fetchSessionData(this.bookId, this.bookType, this.userLanCode)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(res => {
      this.translations = res[0];
      this.sessionData = res[1];
      console.log('translations', this.translations);
      console.log('sessions', this.sessionData);
      this.loadChapters();
    });
  }

  private loadChapters() {
    if (this.isBookRead(this.userBook)) {
      // If only one chapter, load data for this chapter, otherwise display chapters
      if (this.chapters.length === 0) {
        this.msg = this.text['NoChapter'];
      }
      if (this.chapters.length === 1) {
        this.getCurrentChapter(this.chapters[0]._id, true);
      }
      if (this.chapters.length > 1) {
        this.hasChapters = true;
      }
    } else {
      this.msg = this.text['BookNotReadYet'];
    }
  }

  private isBookRead(userBook: UserBook): boolean {
    let isBookRead = false;
    if (userBook && (userBook.repeatCount > 0 || (userBook.bookmark && userBook.bookmark.isBookRead))) {
      isBookRead = true;
    }
    return isBookRead;
  }

  private getCurrentChapter(chapterId: string, singleChapter: boolean) {
    this.readnListenService.fetchChapter(this.bookId, this.bookType, chapterId, 0)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      chapter => {
        this.currentChapter = chapter;
      }
    );
  }

  private getDependables(lan) {
    const options = {
      lan,
      component: 'RevisionComponent',
      getTranslations: true
    };

    this.sharedService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.text = this.sharedService.getTranslatedText(dependables.translations);
        this.getBookId();
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
