import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { SharedService } from '../../services/shared.service';
import { takeWhile, filter } from 'rxjs/operators';
import { zip } from 'rxjs';
import { Book, UserBook } from 'app/models/book.model';

@Component({
  templateUrl: 'book-revision.component.html',
  styleUrls: ['book-revision.component.css']
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

  constructor(
    private route: ActivatedRoute,
    protected userService: UserService,
    protected readnListenService: ReadnListenService,
    protected sharedService: SharedService
  ) {}

  ngOnInit() {
    this.getBookType();
    this.getBookId();
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
    if (this.bookId) {
      this.isLoading = true;
      zip(
        this.readnListenService.fetchBook(this.bookId, this.bookType),
        this.readnListenService.fetchUserBook(this.userLanCode, this.bookId, false),
        this.sharedService.fetchTranslations(this.userService.user.main.lan, 'RevisionComponent')
      )
      .pipe(
        takeWhile(() => this.componentActive))
      .subscribe(res => {
        this.text = this.sharedService.getTranslatedText(res[2]);
        this.book = res[0];
        this.userBook = res[1];
        if (this.isBookRead(this.userBook)) {
          this.msg = 'OK';
        } else {
          this.msg = this.text['BookNotReadYet'];
        }
        console.log('book', this.book);
        console.log('user book', this.userBook);
      });
    }
  }

  private isBookRead(userBook: UserBook): boolean {
    let isBookRead = false;
    if (userBook && (userBook.repeatCount > 0 || (userBook.bookmark && userBook.bookmark.isBookRead))) {
      isBookRead = true;
    }
    return isBookRead;
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
