import { OnDestroy } from '@angular/core';
import { ReadnListenService } from '../services/readnlisten.service';
import { UserService } from '../services/user.service';
import { SharedService } from '../services/shared.service';
import { FilterService } from '../services/filter.service';
import { Map, Language, LicenseUrl } from '../models/main.model';
import { Book, UserBook, UserBookActivity, UserData, TranslationData, ViewFilter } from '../models/book.model';
import { UserWordData } from '../models/word.model';
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
  userWordData: Map<UserWordData> = {}; // glossary
  translationData: Map<TranslationData> = {};
  userBookActivity: Map<UserBookActivity> = {};
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
  bookType: string; // read or listen or glossary
  listTpe = 'all';
  scrollCutOff = 15; // nr of books shown - increases with scrolling
  totalFinished = 0;

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

  protected onChangeListType(tpe: string) {
    this.listTpe = tpe;
    this.filterBooks();
  }

  protected onScrollBooks() {
    this.scrollCutOff += 12;
    if (this.filteredBooks) {
      this.displayBooks = this.filteredBooks.slice(0, this.scrollCutOff);
    }
  }

  protected getNoBooksMessage(bookType: string): string {
    let msgKey: string;
    switch(bookType) {
      case 'listen' : msgKey = 'NoAudioBooksLan'; break;
      case 'glossary' : msgKey = 'NoGlossariesLan'; break;
      default : msgKey = 'NoBooksLan';
    }
    let msg = this.text[msgKey];
    msg = msg.replace('%s', this.bookLanguage.interfaceName);
    if (this.books.length > this.filterBooks.length) {
      msg += '. ' + this.text['RemoveFilters'];
    }
    return msg;
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
        const titleKey = this.bookType === 'glossary' ? 'Glossaries' : (this.bookType === 'listen' ? 'Listen' : 'Read');
        this.sharedService.setPageTitle(this.text, titleKey);
        this.getBooks();
        this.filterUserLanguages();
        this.isReady = true;
      }
    );
  }

  protected setActiveLanguages(bookLanguages: Language[]) {
    bookLanguages.map(lan => lan.interfaceName = this.text[lan.name]);
    bookLanguages.sort((a, b) => a.interfaceName > b.interfaceName ? 1 : b.interfaceName > a.interfaceName ? -1 : 0);
    this.bookLanguages = bookLanguages;
    this.bookLanguage = this.userService.getUserReadLanguage(this.bookLanguages);
  }

  protected getBooks(onlyBooks = false) {

  }

  protected getAllUserData() {
    this.isBooksReady = false;
    zip(
      this.readnListenService.fetchUserBooks(this.myLanguage.code, this.bookType),
      this.readnListenService.fetchSessionData(this.myLanguage.code, this.bookType),
      this.readnListenService.fetchTranslationData(this.myLanguage.code, this.bookType),
      this.readnListenService.fetchActivity(this.myLanguage.code, this.bookType)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      if (data && data.length) {
        this.processUserBooks(data[0]);
        this.processUserData(data[1]);
        this.processTranslations(data[2]);
        this.processActivity(data[3]);
      }
      this.isBooksReady = true;
    });
  }

  private processActivity(activity: UserBookActivity[]) {
    let recommendScore: number,
        finishedScore: number,
        readersScore: number;
    activity.forEach(act => {
      act.popularity = 0;
      if (act.finished > 0) {
        recommendScore = act.recommended > 1 ? act.recommended / act.finished : 0;
        finishedScore = act.started > 2 ? act.finished / act.started : 0;
        readersScore = this.totalFinished > 0 ? act.finished / this.totalFinished : 0;
        act.popularity = recommendScore + finishedScore + readersScore * 10;
      }
      this.userBookActivity[act.bookId] = act;
    });
  }

  protected processUserBooks(uBooks: UserBook[]) {
    this.userBooks = {};
    this.userBooksTest = {};
    this.totalFinished = 0;
    uBooks.forEach(uBook => {
      if (uBook.isTest) {
        this.userBooksTest[uBook.bookId] = uBook;
      } else {
        this.userBooks[uBook.bookId] = uBook;
      }
      this.totalFinished += uBook.bookmark && uBook.bookmark.isBookRead ? 1 : 0;
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
    this.myLanguages.map(lan => lan.interfaceName = this.text[lan.name]);
    this.myLanguages.sort((a, b) => a.interfaceName > b.interfaceName ? 1 : b.interfaceName > a.interfaceName ? -1 : 0);
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
    if (!this.nrOfBooks) {
      this.filteredBooks = [];
      return;
    }
    // List type: my list or all
    switch (this.listTpe) {
      case 'my':
        if (this.bookType === 'glossary') {
          this.filteredBooks = this.books.filter(b =>
            this.userWordData[b._id] && this.userWordData[b._id].count > 0
          );
        } else {
          this.filteredBooks = this.books.filter(
            b => (!!this.userBooks[b._id] && this.userBooks[b._id].subscribed) ||
                 (!!this.userBooksTest[b._id] && this.userBooksTest[b._id].subscribed)
            );
        }
      break;
      default:
        if (this.books) {
          this.filteredBooks = [...this.books];
        }
    }
    // Apply filters
    const filters: string[] = [],
          filter = this.filterService.filter[this.bookType];

    if (filter) {
      if (filter.hideCompleted) {
        this.filteredBooks = this.filteredBooks.filter(b =>
          !(this.userBooks[b._id] && this.userBooks[b._id].bookmark &&
            (this.userBooks[b._id].bookmark.isBookRead || (this.userBooks[b._id].repeatCount || 0 > 0)))
        );
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
    if (itemTxt && this.nrOfBooks && this.filteredBooks) {
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
    // Sort by popularity
    if (this.filterService.sort[this.bookType] === 'popular0') {
      let popularityA: number,
          popularityB: number;
      this.filteredBooks.sort((a, b) => {
        popularityA = this.userBookActivity[a._id] ? this.userBookActivity[a._id].popularity || 0 : 0;
        popularityB = this.userBookActivity[b._id] ? this.userBookActivity[b._id].popularity || 0 : 0;
        return popularityA > popularityB ? -1 : (popularityA < popularityB ? 1 : 0);
      });
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
