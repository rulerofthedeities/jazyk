import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReadService } from '../../services/read.service';
import { UserService } from '../../services/user.service';
import { UtilsService } from '../../services/utils.service';
import { SharedService } from '../../services/shared.service';
import { Language, Map } from '../../models/course.model';
import { Book, UserBook, UserData } from '../../models/book.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  templateUrl: 'read.component.html',
  styleUrls: ['read.component.css']
})

export class ReadComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  bookLanguage: Language;
  myLanguage: Language;
  bookLanguages: Language[];
  userLanguages: Language[];
  books: Book[];
  userBooks: Map<UserBook> = {}; // For sorting
  userData: Map<UserData> = {};
  isLoading = false;
  isError = false;
  isReady = false;
  IsBooksReady = false;
  listTpe = 'all';

  constructor(
    private readService: ReadService,
    private userService: UserService,
    private utilsService: UtilsService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.getDependables();
  }

  onBookLanguageSelected(lan: Language) {
    this.bookLanguage = lan;
    this.getBooks();
  }

  onMyLanguageSelected(lan: Language) {
    this.myLanguage = lan;
    this.getUserBooks();
    this.getUserData();
  }

  onChangeBookType(tpe: string) {
    this.listTpe = tpe;
  }

  onRemovedSubscription(book: Book) {
    this.userBooks[book._id].subscribed = false;
  }

  private getBooks() {
    this.getUserBooks();
    this.getUserData();
    this.isLoading = true;
    this.readService
    .fetchPublishedBooks(this.bookLanguage.code)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      books => {
        console.log('books', books);
        this.books = books;
        this.isLoading = false;
        this.IsBooksReady = true;
      }
    );
  }

  private getUserBooks() {
    this.readService
    .fetchUserBooks(this.myLanguage.code) // interface lan
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      books => {
        this.userBooks = {};
        console.log('user books', books);
        books.forEach(uBook => {
          this.userBooks[uBook.bookId] = uBook;
        });
      }
    );
  }

  private getUserData() {
    this.readService
    .fetchSessionData(this.myLanguage.code) // interface lan
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      sessionData => {
        this.userData = {};
        sessionData.forEach(session => {
          this.userData[session.bookId] = session;
        });
        console.log('user data', this.userData);
      }
    );
  }

  private getDependables() {
    const options = {
      lan: this.userService.user.main.lan,
      component: 'ReadComponent',
      getTranslations: true,
      getLanguages: true
    };
    this.utilsService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.text = this.utilsService.getTranslatedText(dependables.translations);
        this.setActiveLanguages(dependables.bookLanguages);
        this.userLanguages = dependables.userLanguages;
        this.myLanguage = this.userService.getUserLanguage(this.userLanguages);
        this.utilsService.setPageTitle(this.text, 'Read');
        this.getBooks();
        this.isReady = true;
      }
    );
  }

  private setActiveLanguages(bookLanguages: Language[]) {
    this.bookLanguages = bookLanguages;
    const allLanguage = this.utilsService.getAllLanguage();
    this.bookLanguages.unshift(allLanguage);
    console.log('book languages', this.bookLanguages);
    this.bookLanguage = this.userService.getUserLearnLanguage(this.bookLanguages);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
