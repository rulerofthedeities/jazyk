import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReadService } from '../../services/read.service';
import { UserService } from '../../services/user.service';
import { UtilsService } from '../../services/utils.service';
import { Language, Map, LicenseUrl } from '../../models/course.model';
import { Book, UserBook, UserData, TranslationData } from '../../models/book.model';
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
  licenses: LicenseUrl[];
  private userLanguages: Language[];
  myLanguages: Language[]; // filter out selected book language
  private books: Book[];
  filteredBooks: Book[] = [];
  userBooks: Map<UserBook> = {}; // For sorting
  userData: Map<UserData> = {};
  translationData: Map<TranslationData> = {};
  isLoading = false;
  isError = false;
  isReady = false;
  IsBooksReady = false;
  listTpe = 'all';
  sort = 'difficulty1';
  nrOfBooks: number;
  itemTxt: string;

  constructor(
    private readService: ReadService,
    private userService: UserService,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.getDependables();
  }

  onBookLanguageSelected(lan: Language) {
    this.userService.setLanCode(lan.code);
    if (lan.code === this.myLanguage.code) {
      // book language === user language, swap
      this.myLanguage = this.bookLanguage;
    }
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
    this.filterBooks();
  }

  onChangeSort(sort: string) {
    this.sort = sort;
    this.getBooks(true);
  }

  onRemovedSubscription(book: Book) {
    this.userBooks[book._id].subscribed = false;
  }

  getFilterCount() {
  }

  private filterBooks() {
    switch (this.listTpe) {
      case 'my':
      this.filteredBooks = this.books.filter(b => !!this.userBooks[b._id] && this.userBooks[b._id].bookmark);
      break;
      default:
        this.filteredBooks = [...this.books];
    }
    let itemTxt = this.text['ShowingItems'];
    if (itemTxt) {
      itemTxt = itemTxt.replace('%1', this.filteredBooks.length.toString());
      itemTxt = itemTxt.replace('%2', this.nrOfBooks.toString());
    }
    this.itemTxt = itemTxt;
  }

  private getBooks(onlyBooks = false) {
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

  private getDependables() {
    const options = {
      lan: this.userService.user.main.lan,
      component: 'ReadComponent',
      getTranslations: true,
      getLanguages: true,
      getLicenses: true
    };
    this.utilsService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.licenses = dependables.licenseUrls;
        this.text = this.utilsService.getTranslatedText(dependables.translations);
        this.setActiveLanguages(dependables.bookLanguages);
        this.userLanguages = dependables.userLanguages;
        this.myLanguage = this.userService.getUserLanguage(this.userLanguages);
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
    this.bookLanguage = this.userService.getUserLearnLanguage(this.bookLanguages);
  }

  private filterUserLanguages() {
    // filter out selected book language
    this.myLanguages = this.userLanguages.filter(lan => lan.code !== this.bookLanguage.code);
    // check if current language is in list
    let isInList = this.myLanguages.find(lan => lan.code === this.myLanguage.code);
    if (!isInList) {
      // use user language
      const userLanCode = this.userService.user.main.myLan,
            userLan = this.myLanguages.find(lan => lan.code === userLanCode);
      if (userLan) {
        this.myLanguage = userLan;
      }
    }
    isInList = this.myLanguages.find(lan => lan.code === this.myLanguage.code);
    if (!isInList) {
      // use default fr if not book language - most common right now
      if (this.bookLanguage.code !== 'fr') {
        this.myLanguage = this.myLanguages.find(lan => lan.code === 'fr');
      } else {
        // else use the first in the list
        this.myLanguage = this.myLanguages[0];
      }
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
