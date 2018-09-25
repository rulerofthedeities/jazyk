import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReadService } from '../../services/read.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { Language, Map, LicenseUrl } from '../../models/main.model';
import { Book, UserBook, UserData, TranslationData } from '../../models/book.model';
import { takeWhile } from 'rxjs/operators';
import { ReadnListenComponent } from '../readnlisten/readnListen.component';

@Component({
  templateUrl: 'read.component.html',
  styleUrls: ['read.component.css']
})

export class ReadComponent extends ReadnListenComponent implements OnInit, OnDestroy {

  constructor(
    readService: ReadService,
    readnListenService: ReadnListenService,
    userService: UserService,
    sharedService: SharedService
  ) {
    super(readService, readnListenService, userService, sharedService);
  }

  ngOnInit() {
    this.tpe = 'read';
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
    this.readService
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

  private getUserBooks() {
    this.readService
    .fetchUserBooks(this.myLanguage.code)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      books => {
        this.userBooks = {};
        books.forEach(uBook => {
          this.userBooks[uBook.bookId] = uBook;
        });
      }
    );
  }

  private getUserData() {
    this.readService
    .fetchSessionData(this.myLanguage.code)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      sessionData => {
        this.userData = {};
        sessionData.forEach(session => {
          this.userData[session.bookId] = session;
        });
      }
    );
  }

  private getBookTranslations() {
    this.readService
    .fetchTranslationData(this.myLanguage.code)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        this.translationData = {};
        translations.forEach(translation => {
          this.translationData[translation.bookId] = translation;
        });
      }
    );
  }


}
