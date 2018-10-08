import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { Language } from '../../models/main.model';
import { Book } from '../../models/book.model';
import { takeWhile } from 'rxjs/operators';
import { ReadnListenListComponent } from '../../abstracts/readnListen-list.abstract';

@Component({
  templateUrl: 'read.component.html',
  styleUrls: ['read.component.css']
})

export class ReadComponent extends ReadnListenListComponent implements OnInit, OnDestroy {

  constructor(
    readnListenService: ReadnListenService,
    userService: UserService,
    sharedService: SharedService
  ) {
    super(readnListenService, userService, sharedService);
  }

  ngOnInit() {
    this.bookType = 'read';
    this.getDependables();
  }

  onMyLanguageSelected(lan: Language) {
    this.userService.setUserLanCode(lan.code);
    this.myLanguage = lan;
    this.getUserBooks();
    this.getUserData();
    this.getBookTranslations();
  }

  onRemovedSubscription(book: Book) {
    this.userBooks[book._id].subscribed = false;
  }

  getFilterCount() {
  }

  protected getBooks(onlyBooks = false) {
    if (!onlyBooks) { // Not required if resorted
      this.getUserBooks();
      this.getUserData();
      this.getBookTranslations();
    }
    this.isLoading = true;
    this.readnListenService
    .fetchPublishedBooks(this.bookLanguage.code, this.sort)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      books => {
        this.books = books;
        if (books) {
          this.nrOfBooks = books.length;
          this.filterBooks();
        }
        this.isLoading = false;
        this.IsBooksReady = true;
      }
    );
  }
}
