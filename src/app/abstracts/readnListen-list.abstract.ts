import { OnDestroy } from '@angular/core';
import { ReadnListenService } from '../services/readnlisten.service';
import { UserService } from '../services/user.service';
import { SharedService } from '../services/shared.service';
import { FilterService } from '../services/filter.service';
import { Map, Language, LicenseUrl } from '../models/main.model';
import { Book, UserBook, UserData, TranslationData, ViewFilter } from '../models/book.model';
import { takeWhile } from 'rxjs/operators';
import { zip } from 'rxjs';

export abstract class ReadnListenListComponent implements OnDestroy {
  protected componentActive = true;
  protected userLanguages: Language[];
  protected books: Book[];
  protected filteredBooks: Book[] = [];
  displayBooks: Book[]; // books shown in infinite scroll
  userBooks: Map<UserBook> = {}; // For sorting
  userBooksTest: Map<UserBook> = {};
  userData: Map<UserData>[] = [];
  userDataTest: Map<UserData>[] = [];
  translationData: Map<TranslationData> = {};
  bookLanguage: Language;
  bookLanguages: Language[];
  myLanguages: Language[]; // filter out selected book language
  myLanguage: Language;
  text: Object = {};
  licenses: LicenseUrl[];
  isReady = false;
  isLoading = false;
  isError = false;
  isBooksReady = false;
  itemTxt: string;
  nrOfBooks: number;
  bookType: string; // read or listen
  listTpe = 'all';
  scrollCutOff = 15; // nr of books shown - increases with scrolling

  constructor(
    protected readnListenService: ReadnListenService,
    protected userService: UserService,
    protected sharedService: SharedService,
    protected filterService: FilterService
  ) {}

  protected onChangeSort(newSort: string) {
    this.filterService.sort[this.bookType] = newSort;
    this.getBooks(true);
  }

  protected onChangeFilter(newFilter: ViewFilter) {
    this.filterService.filter[this.bookType] = newFilter;
    this.filterBooks();
  }

  protected onBookLanguageSelected(lan: Language) {
    this.userService.setLanCode(lan.code);
    if (lan.code === this.myLanguage.code) {
      // book language === user language, swap
      this.myLanguage = this.bookLanguage;
    }
    this.bookLanguage = lan;
    this.filterUserLanguages();
    this.getBooks();
  }

  protected onMyLanguageSelected(lan: Language) {
    this.userService.setUserLanCode(lan.code);
    this.myLanguage = lan;
    this.getAllUserData();
  }

  protected onChangeBookType(tpe: string) {
    this.listTpe = tpe;
    this.filterBooks();
  }

  protected onScrollBooks() {
    this.scrollCutOff += 12;
    if (this.filteredBooks) {
      this.displayBooks = this.filteredBooks.slice(0, this.scrollCutOff);
    }
  }

  protected getDependables() {
    const options = {
      lan: this.userService.user.main.lan,
      component: 'ReadComponent',
      getTranslations: true,
      getLanguages: true,
      getLicenses: true
    };
    this.isLoading = true;
    this.sharedService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.licenses = dependables.licenseUrls;
        this.text = this.sharedService.getTranslatedText(dependables.translations);
        this.setActiveLanguages(dependables.bookLanguages);
        this.userLanguages = dependables.userLanguages;
        this.myLanguage = this.userService.getUserLanguage(this.userLanguages);
        this.sharedService.setPageTitle(this.text, this.bookType === 'listen' ? 'Listen' : 'Read');
        this.getBooks();
        this.filterUserLanguages();
        this.isReady = true;
      }
    );
  }

  protected setActiveLanguages(bookLanguages: Language[]) {
    this.bookLanguages = bookLanguages;
    const allLanguage = this.sharedService.getAllLanguage();
    this.bookLanguages.unshift(allLanguage);
    this.bookLanguage = this.userService.getUserReadLanguage(this.bookLanguages);
  }

  protected getBooks(onlyBooks = false) {

  }

  protected getAllUserData() {
    this.isBooksReady = false;
    zip(
      this.readnListenService.fetchUserBooks(this.myLanguage.code, this.bookType),
      this.readnListenService.fetchSessionData(this.myLanguage.code, this.bookType),
      this.readnListenService.fetchTranslationData(this.myLanguage.code, this.bookType)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      if (data && data.length) {
        this.processUserBooks(data[0]);
        this.processUserData(data[1]);
        this.processTranslations(data[2]);
      }
      this.isBooksReady = true;
    });
  }

  private processUserBooks(uBooks: UserBook[]) {
    this.userBooks = {};
    this.userBooksTest = {};
    uBooks.forEach(uBook => {
      if (uBook.isTest) {
        this.userBooksTest[uBook.bookId] = uBook;
      } else {
        this.userBooks[uBook.bookId] = uBook;
      }
    });
    if (this.filterService.filter[this.bookType].hideCompleted) {
      this.filterBooks();
    }
  }

  private processUserData(sessionData: UserData[]) {
    this.userData = [];
    this.userDataTest = [];
    // Arrange all sessions per book
    sessionData.forEach(session => {
      if (session.isTest) {
        this.userDataTest[session.bookId] = this.userDataTest[session.bookId] ? this.userDataTest[session.bookId] : [];
        this.userDataTest[session.bookId].push(session);
      } else {
        this.userData[session.bookId] = this.userData[session.bookId] ? this.userData[session.bookId] : [];
        this.userData[session.bookId].push(session);
      }
    });
  }

  private processTranslations(translations: TranslationData[]) {
    this.translationData = {};
    translations.forEach(translation => {
      this.translationData[translation.bookId] = translation;
    });
    if (this.filterService.filter[this.bookType].hideNotTranslated) {
      this.filterBooks();
    }
  }

  protected filterUserLanguages() {
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
      // use interface language
      const interfaceLanCode = this.userService.user.main.lan,
            interfaceLan = this.myLanguages.find(lan => lan.code === interfaceLanCode);
      if (interfaceLan) {
        this.myLanguage = interfaceLan;
      }
    }
    if (!isInList) {
      // use default fr if not book language - most common right now
      if (this.bookLanguage.code !== 'fr') {
        this.myLanguage = this.myLanguages.find(lan => lan.code === 'fr');
      } else {
        // else use the first in the list that if it is not the book language
        if (this.bookLanguage.code !== this.myLanguages[0].code) {
          this.myLanguage = this.myLanguages[0];
        } else if (this.myLanguages.length > 0) {
          this.myLanguage = this.myLanguages[1];
        }
      }
    }
  }

  protected filterBooks() {
    // List type: my list or all
    switch (this.listTpe) {
      case 'my':
      this.filteredBooks = this.books.filter(
        b => (!!this.userBooks[b._id] && this.userBooks[b._id].subscribed) ||
             (!!this.userBooksTest[b._id] && this.userBooksTest[b._id].subscribed)
        );
      break;
      default:
        this.filteredBooks = [...this.books];
    }
    // Apply filters
    const filters: string[] = [],
          filter = this.filterService.filter[this.bookType];

    if (filter) {
      if (filter.hideCompleted) {
        this.filteredBooks = this.filteredBooks.filter(b =>
          !(this.userBooks[b._id] && this.userBooks[b._id].bookmark && this.userBooks[b._id].bookmark.isBookRead));
        filters.push(this.text['CompletedOnly']);
      }
      if (filter.hideNotTranslated) {
        this.filteredBooks = this.filteredBooks.filter(b => {
          const bookId = b.bookId ? b.bookId : b._id;
          return this.translationData[bookId] && this.translationData[bookId].count >= b.difficulty.nrOfUniqueSentences;
        });
        filters.push(this.text['TranslatedOnly']);
      }
      if (filter.hideOld) {
        this.filteredBooks = this.filteredBooks.filter(b => b.year >= 1945);
        filters.push(this.text['ModernOnly']);
      }
      if (filter.hideEasy) {
        this.filteredBooks = this.filteredBooks.filter(b => b.difficulty.weight > 400);
      }
      if (filter.hideAdvanced) {
        this.filteredBooks = this.filteredBooks.filter(b => b.difficulty.weight < 480);
      }
      if (filter.hideMedium) {
        this.filteredBooks = this.filteredBooks.filter(b => b.difficulty.weight <= 400 || b.difficulty.weight >= 480);
      }
      if (filter.hideEasy && filter.hideMedium && !filter.hideAdvanced) {
        filters.push(this.text['AdvancedOnly']);
      }
      if (filter.hideEasy && !filter.hideMedium && !filter.hideAdvanced) {
        filters.push(this.text['AdvancedMediumOnly']);
      }
      if (filter.hideEasy && !filter.hideMedium && filter.hideAdvanced) {
        filters.push(this.text['MediumOnly']);
      }
      if (!filter.hideEasy && filter.hideMedium && filter.hideAdvanced) {
        filters.push(this.text['EasyOnly']);
      }
      if (!filter.hideEasy && !filter.hideMedium && filter.hideAdvanced) {
        filters.push(this.text['EasyMediumOnly']);
      }
      if (!filter.hideEasy && filter.hideMedium && !filter.hideAdvanced) {
        filters.push(this.text['EasyAdvancedOnly']);
      }
    }
    // Set display text
    let itemTxt = this.text['ShowingItems'];
    if (itemTxt) {
      itemTxt = itemTxt.replace('%1', this.filteredBooks.length.toString());
      itemTxt = itemTxt.replace('%2', this.nrOfBooks.toString());
    }
    this.itemTxt = itemTxt;
    this.filterService.filterTxt[this.bookType] = this.text['NoFilter'];
    this.filterService.hasFilter[this.bookType] = false;
    if (filters.length) {
      this.filterService.hasFilter[this.bookType] = true;
      this.filterService.filterTxt[this.bookType] = this.text['Only'] + ' ';
      this.filterService.filterTxt[this.bookType] += filters.join(', ');
    }
    this.resetScroll();
  }

  private resetScroll() {
    this.scrollCutOff = 15;
    if (this.filteredBooks) {
      this.displayBooks = this.filteredBooks.slice(0, this.scrollCutOff);
    }
  }

  protected onRemovedSubscription(book: Book) {
  }

  protected onAddedSubscription(book: Book) {
    if (this.userBooks[book._id]) {
      this.userBooks[book._id].subscribed = true;
    }
    this.filterBooks();
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
