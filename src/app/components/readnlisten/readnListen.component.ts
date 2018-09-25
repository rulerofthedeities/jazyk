import { OnInit, OnDestroy } from '@angular/core';

// TMP: remove later?
import { ReadService } from '../../services/read.service';

import { ReadnListenService } from '../../services/readnlisten.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { Map, Language, LicenseUrl } from '../../models/main.model';
import { Book, UserBook, UserData, TranslationData } from '../../models/book.model';
import { takeWhile } from 'rxjs/operators';

export abstract class ReadnListenComponent implements OnDestroy {
  protected componentActive = true;
  protected userLanguages: Language[];
  protected books: Book[];
  filteredBooks: Book[] = [];
  userBooks: Map<UserBook> = {}; // For sorting
  userData: Map<UserData> = {};
  translationData: Map<TranslationData> = {};
  bookLanguage: Language;
  bookLanguages: Language[];
  myLanguages: Language[]; // filter out selected book language
  myLanguage: Language;
  text: Object = {};
  licenses: LicenseUrl[];
  isReady = false;
  isLoading = false;
  IsBooksReady = false;
  itemTxt: string;
  nrOfBooks: number;
  sort = 'difficulty1';
  tpe: string; // read or listen
  listTpe = 'all';

  constructor(
    protected readService: ReadService,
    protected readnListenService: ReadnListenService,
    protected userService: UserService,
    protected sharedService: SharedService
  ) {}

  protected onChangeSort(sort: string) {
    this.sort = sort;
    this.getBooks(true);
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
  }

  protected onChangeBookType(tpe: string) {
    this.listTpe = tpe;
    this.filterBooks();
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
        this.sharedService.setPageTitle(this.text, this.tpe === 'listen' ? 'Listen' : 'Read');
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

  protected onRemovedSubscription(book: Book) {
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
