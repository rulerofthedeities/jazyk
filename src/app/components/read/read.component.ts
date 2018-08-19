import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReadService } from '../../services/read.service';
import { UserService } from '../../services/user.service';
import { UtilsService } from '../../services/utils.service';
import { SharedService } from '../../services/shared.service';
import { Language, Map } from '../../models/course.model';
import { Book, UserBook, UserData, TranslationData } from '../../models/book.model';
import { takeWhile } from 'rxjs/operators';
import { lang } from 'moment';

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
  private userLanguages: Language[];
  myLanguages: Language[]; // filter out selected book language
  books: Book[];
  userBooks: Map<UserBook> = {}; // For sorting
  userData: Map<UserData> = {};
  translationData: Map<TranslationData> = {};
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
    this.userService.setLanCode(lan.code);
    this.bookLanguage = lan;
    this.filterUserLanguages();
    this.getBooks();
  }

  onMyLanguageSelected(lan: Language) {
    this.userService.setUserLanCode(lan.code);
    this.myLanguage = lan;
    this.getUserBooks();
    this.getUserData();
    this.getBookTranslations();
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
    this.getBookTranslations();
    this.isLoading = true;
    this.readService
    .fetchPublishedBooksByWeight(this.bookLanguage.code)
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
    .fetchUserBooks(this.myLanguage.code)
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
    .fetchSessionData(this.myLanguage.code)
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

  private getBookTranslations() {
    this.readService
    .fetchTranslationData(this.bookLanguage.code, this.myLanguage.code)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        this.translationData = {};
        translations.forEach(translation => {
          this.translationData[translation.bookId] = translation;
        });
        console.log('translation data', this.translationData);
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
        console.log('my language', this.myLanguage);
        this.utilsService.setPageTitle(this.text, 'Read');
        this.getBooks();
        this.filterUserLanguages();
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

  private filterUserLanguages() {
    // filter out selected book language
    console.log('filter user languages');
    this.myLanguages = this.userLanguages.filter(lan => lan.code !== this.bookLanguage.code);
    if (this.myLanguage.code === this.bookLanguage.code && this.myLanguages.length > 0) {
      console.log('change my lan', this.myLanguages[0]);
      this.myLanguage = this.myLanguages[0];
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
