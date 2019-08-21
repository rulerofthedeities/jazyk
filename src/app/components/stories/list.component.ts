import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { StoriesService } from 'app/services/stories.service';
import { FilterService } from 'app/services/filter.service';
import { Map, Language, LicenseUrl } from '../../models/main.model';
import { Book, UserBookActivity, UserBookLean, UserDataLean, TranslationData,
        FinishedData, FinishedTab, ViewFilter } from '../../models/book.model';
import { UserWordCount, UserWordData } from '../../models/word.model';
import { takeWhile } from 'rxjs/operators';
import { zip, of, Subject, BehaviorSubject } from 'rxjs';

@Component({
  templateUrl: 'list.component.html',
  styleUrls: ['list.component.css']
})

export class StoryListComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private userLanguages: Language[];
  isReady = false;
  isBooksReady = false;
  isActivityReady = false;
  isTranslationDataReady = false;
  isFinishedDataReady = false;
  isTypeDataReady = false;
  isLoading = false;
  isMyList = false;
  text: Object = {};
  listTpe: string; // read, listen or glossary
  licenses: LicenseUrl[];
  bookLanguages: Language[];
  targetLanguages: Language[];
  bookLanguage: Language;
  targetLanguage: Language;
  books: Book[];
  filteredBooks: Book[];
  displayBooks: Book[];
  translationCount: Map<number> = {};
  finishedTabs: Map<FinishedTab> = {};
  userBookActivity: Map<UserBookActivity> = {};
  userBooks: Map<UserBookLean> = {}; // For sorting
  userBooksTest: Map<UserBookLean> = {};
  userData: Map<UserDataLean>[] = [];
  userDataTest: Map<UserDataLean>[] = [];
  bookWordCount: Map<UserWordCount> = {}; // glossary translations count
  userWordCount: Map<UserWordCount> = {}; // glossary count
  userWordData: Map<UserWordData> = {}; // glossary answer data
  nrOfBooks: number;
  scrollCutOff = 15; // nr of books shown - increases with scrolling
  initScrollCutOff = 15;
  scrollDelta = 5;
  itemTxt: string; // filter
  showFilter: boolean;
  filterChanged: Subject<boolean> = new Subject();
  listTpeChanged: BehaviorSubject<string> = new BehaviorSubject('read');
  targetLanguageChanged: BehaviorSubject<Language>;

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private userService: UserService,
    private sharedService: SharedService,
    private storiesService: StoriesService,
    private filterService: FilterService
  ) {}

  ngOnInit() {
    this.showFilter = true;
    this.listTpe = 'read';
    this.getListTpe();
    this.filterService.initFilter(this.listTpe);
    this.filterService.initSort(this.listTpe);
    this.getDependables();
  }

  onChangeListType(tpe: string) {
    this.listTpe = tpe;
    this.listTpeChanged.next(tpe);
    this.updateUrl(tpe);
    this.setPageName(tpe);
    this.clearData();
    this.filterBooks();
    this.getPostActivityData();
  }

  onBookLanguageSelected(lan: Language) {
    this.userService.setLanCode(lan.code);
    if (lan.code === this.targetLanguage.code) {
      // book language === user language, swap
      this.targetLanguage = this.bookLanguage;
    }
    this.bookLanguage = lan;
    this.filterUserLanguages();
    this.getBooks();
  }

  onMyLanguageSelected(lan: Language) {
    this.userService.setUserLanCode(lan.code);
    this.targetLanguage = lan;
    this.getTranslationData();
    this.getFinishedCheck();
  }

  onChangeMyList(tpe: string) {
    console.log('changing my list', tpe);
    this.isMyList = tpe === 'my';
    this.filterBooks();
    this.getTypeData();
  }

  onChangeSort(newSort: string) {
    this.filterService.sort[this.listTpe] = newSort;
    // this.displayBooks = [];
    // this.isBooksReady = false;
    this.getBooks(false);
  }

  onChangeFilter(newFilter: ViewFilter) {
    this.filterService.filter[this.listTpe] = newFilter;
    // this.displayBooks = [];
    // this.scrollCutOff = 0;
    this.filterBooks();
  }

  onScrollBooksDown() {
    this.scrollCutOff += this.scrollDelta;
    console.log('scroll down', this.scrollCutOff);
    this.scrollBooks();
  }

  onTrackBook(index: number, item: Book) {
    return item._id;
  }

  onAddedSubscription(book: Book) {
    if (this.userBooks[book._id]) {
      this.userBooks[book._id].subscribed = true;
    }
    this.filterBooks();
  }

  onRemovedSubscription(book: Book) {
    this.userBooks[book._id].subscribed = false;
    this.filterBooks();
  }

  getNoBooksMessage(): string {
    let msgKey: string;
    switch(this.listTpe) {
      case 'listen' : msgKey = 'NoAudioBooksLan'; break;
      case 'glossary' : msgKey = 'NoGlossariesLan'; break;
      default : msgKey = 'NoBooksLan';
    }
    let msg = this.text[msgKey];
    msg = msg.replace('%s', this.bookLanguage.interfaceName);
    if (this.books.length > this.filteredBooks.length) {
      msg += '. ' + this.text['RemoveFilters'];
    }
    return msg;
  }

  private updateUrl(tpe: string) {
    const path = tpe === 'glossary' ? 'glossaries' : tpe;
    this.location.go(`/${path}`);
  }

  private setPageName(tpe: string) {
    let titleKey = 'Stories';
    titleKey += this.listTpe;
    this.sharedService.setPageTitle(this.text, titleKey);
  }

  private getBooks(onlyBooks = false) {
    console.log('get books');
    this.filteredBooks = [];
    this.isLoading = true;
    zip(
      this.storiesService.fetchPublishedBooks(this.bookLanguage.code, this.filterService.sort[this.listTpe]),
      onlyBooks ? of([]) : this.storiesService.fetchActivity()
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      data => {
        this.books = data[0];
        console.log('books', this.books);
        this.displayBooks = [];
        if (this.books && this.books.length) {
          this.nrOfBooks = this.books.length;
          this.filterBooks();
        }
        this.isBooksReady = true;
        this.isLoading = false;
        if (data[1] && data[1].length) {
          this.processActivity(data[1]);
        }
      }
    );
  }

  private processActivity(activity: UserBookActivity[]) {
    let recommendScore: number,
        finishedScore: number,
        readersScore: number;
    const getTotalFinished = act => act.reduce((a, b) => a.finished + b.finished, 0);
    const totalFinished = getTotalFinished(activity);
    activity.forEach(act => {
      act.popularity = 0;
      if (act.finished > 0) {
        recommendScore = act.recommended > 1 ? act.recommended / act.finished : 0;
        finishedScore = act.started > 2 ? act.finished / act.started : 0;
        readersScore = totalFinished > 0 ? act.finished / totalFinished : 0;
        act.popularity = recommendScore + finishedScore + readersScore * 10;
      }
      this.userBookActivity[act.bookId] = act;
    });
    this.isActivityReady = true;
    this.getPostActivityData();
  }

  private getPostActivityData() {
    // fetch all data once we have the activity data
    console.log('getting post activity data');
    this.getTypeData();
    if (this.listTpe !== 'glossary') {
      this.getTranslationData();
    } else {
      this.getWordData();
    }
    this.getFinishedCheck();
  }

  private getTypeData() {
    this.isTypeDataReady = false;
    if (this.listTpe !== 'glossary') {
      zip(
        this.storiesService.fetchUserBooks(this.targetLanguage.code, this.listTpe),
        this.storiesService.fetchSessionData(this.targetLanguage.code, this.listTpe)
      )
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(data => {
        if (data && data.length) {
          this.processUserBooks(data[0]);
          this.processSessionData(data[1]);
        }
        this.isTypeDataReady = true;
      });
    } else {
      zip(
        this.storiesService.fetchUserBooks(this.targetLanguage.code, this.listTpe),
        this.storiesService.fetchUserWords(this.targetLanguage.code)
      )
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(data => {
        if (data && data.length) {
          this.processUserBooks(data[0]);
          this.processUserWordData(data[1]);
        }
        this.isTypeDataReady = true;
      });
    }
  }

  getWordData() {
    zip(
      this.storiesService.fetchUserWordCounts(this.bookLanguage.code, this.targetLanguage.code),
      this.storiesService.fetchBookWordCounts(this.bookLanguage.code, this.targetLanguage.code)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      if (data && data.length) {
        this.processUserWordCount(data[0]);
        this.processWordTranslations(data[1]);
      }
      this.isBooksReady = true;
    });
  }

  private processUserWordCount(userwords: UserWordCount[]) {
    // First clear data (if different language has been selected)
    Object.keys(this.userWordCount).forEach((key, index) => {
      this.userWordCount[key].countTotal = 0;
      this.userWordCount[key].countTranslation = 0;
    });
    // Add new data
    userwords.forEach(count => {
      this.userWordCount[count.bookId] = count;
      delete count.bookId;
    });
  }

  private processUserWordData(userwords: UserWordData[]) {
    // First clear data (if different language has been selected)
    Object.keys(this.userWordData).forEach((key, index) => {
      this.userWordData[key].lastAnswerYes = 0;
      this.userWordData[key].lastAnswerNo = 0;
      this.userWordData[key].pinned = 0;
    });
    // Add new data
    userwords.forEach(data => {
      this.userWordData[data.bookId] = data;
      delete data.bookId;
    });
  }

  private processWordTranslations(translations: UserWordCount[]) {
    // First clear data (if different language has been selected)
    Object.keys(this.bookWordCount).forEach((key, index) => {
      this.bookWordCount[key].countTotal = 0;
      this.bookWordCount[key].countTranslation = 0;
    });
    // Add new data
    translations.forEach(count => {
      this.bookWordCount[count.bookId] = count;
      delete count.bookId;
    });
  }

  private getTranslationData() {
    this.isTranslationDataReady = false;
    this.storiesService
    .fetchTranslationData(this.targetLanguage.code)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(translationData => {
      this.processTranslations(translationData);
      this.isTranslationDataReady = true;
    });
  }

  private getFinishedCheck() {
    // Check which tabs have been finished
    this.isFinishedDataReady = false;
    this.storiesService
    .fetchFinishedData(this.targetLanguage.code)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(finishedData => {
      this.processFinishedData(finishedData);
      this.isFinishedDataReady = true;
    });
  }

  private processFinishedData(finishedData: FinishedData[]) {
    console.log('finished data', finishedData);
    finishedData.forEach(finished => {
      this.finishedTabs[finished.bookId] = !!this.finishedTabs[finished.bookId] ? this.finishedTabs[finished.bookId] : {
        read: false,
        listen: false,
        listenDefault: false,
        listenTest: false,
        glossary: false
      };
      if (finished.isTest && finished.bookType === 'listen') {
        this.finishedTabs[finished.bookId].listenTest = !!finished.isFinished;
      }
      switch (finished.bookType) {
        case 'read':
          this.finishedTabs[finished.bookId].read = !!finished.isFinished;
          break;
        case 'listen':
          if (finished.isTest) {
            this.finishedTabs[finished.bookId].listenTest = !!finished.isFinished;
          } else {
            this.finishedTabs[finished.bookId].listenDefault = !!finished.isFinished;
          }
          if (this.finishedTabs[finished.bookId].listenDefault || this.finishedTabs[finished.bookId].listenTest) {
            this.finishedTabs[finished.bookId].listen = true;
          }
          break;
        case 'glossary':
          this.finishedTabs[finished.bookId].glossary = !!finished.isFinished;
          break;
      }
    });
  }

  private processUserBooks(uBooks: UserBookLean[]) {
    this.userBooks = {};
    this.userBooksTest = {};
    uBooks.forEach(uBook => {
      if (uBook.isTest) {
        this.userBooksTest[uBook.bookId] = uBook;
      } else {
        this.userBooks[uBook.bookId] = uBook;
      }
      delete uBook.bookId;
    });
    uBooks = undefined;
    if (this.filterService.filter[this.listTpe] && this.filterService.filter[this.listTpe].hideCompleted) {
      this.filterBooks();
    }
  }

  private processSessionData(sessionData: UserDataLean[]) {
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
      delete session.bookId;
    });
    sessionData = undefined;
  }

  private processTranslations(translationData: TranslationData[]) {
    this.translationCount = {};
    translationData.forEach(translation => {
      this.translationCount[translation.bookId] = translation.count;
    });
    translationData = undefined;
    if (this.filterService.filter[this.listTpe] && this.filterService.filter[this.listTpe].hideNotTranslated) {
      this.filterBooks();
    }
  }

  private filterBooks() {
    console.log('filtering books');
    if (!this.nrOfBooks) {
      this.filteredBooks = [];
      return;
    }
    // List Type: read, listen or glossary
    console.log('FILTER', this.listTpe);
    switch (this.listTpe) {
      case 'listen':
          this.filteredBooks = this.books.filter(b => b.audioPublished);
        break;
      case 'glossary':
          this.filteredBooks = this.books.filter(b => b.wordListPublished);
        break;
      default: this.filteredBooks = [...this.books];
    }

    // List type: my list or all
    if (this.isMyList) {
      this.filteredBooks = this.filteredBooks.filter(
        b => (!!this.userBooks[b._id] && this.userBooks[b._id].subscribed)
      );
    }

    // Apply filters
    const filters: string[] = [],
          filter = this.filterService.filter[this.listTpe];

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
          return this.translationCount[bookId] >= b.difficulty.nrOfUniqueSentences;
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
    // Sort by popularity
    if (this.filterService.sort[this.listTpe] === 'popular0') {
      let popularityA: number,
          popularityB: number;
      this.filteredBooks.sort((a, b) => {
        popularityA = this.userBookActivity[a._id] ? this.userBookActivity[a._id].popularity || 0 : 0;
        popularityB = this.userBookActivity[b._id] ? this.userBookActivity[b._id].popularity || 0 : 0;
        return popularityA > popularityB ? -1 : (popularityA < popularityB ? 1 : 0);
      });
    }
    // Set display text
    this.setFilterDisplayTxt(filters);
    this.resetScroll();
  }

  private setFilterDisplayTxt(filters: string[]) {
    let itemTxt = this.text['ShowingItems'];
    if (itemTxt && this.nrOfBooks && this.filteredBooks) {
      itemTxt = itemTxt.replace('%1', this.filteredBooks.length.toString());
      itemTxt = itemTxt.replace('%2', this.nrOfBooks.toString());
    }
    this.itemTxt = itemTxt;
    this.filterService.filterTxt[this.listTpe] = this.text['NoFilter'];
    this.filterService.hasFilter[this.listTpe] = false;
    if (filters.length) {
      this.filterService.hasFilter[this.listTpe] = true;
      this.filterService.filterTxt[this.listTpe] = this.text['Only'] + ' ';
      this.filterService.filterTxt[this.listTpe] += filters.join(', ');
    }
    this.filterChanged.next(true);
  }

  private resetScroll() {
    this.scrollCutOff = this.initScrollCutOff;
    this.scrollBooks();
  }

  private scrollBooks() {
    if (this.filteredBooks) {
      this.scrollCutOff = Math.min(Math.max(0, this.scrollCutOff), this.filteredBooks.length);
      this.displayBooks = this.filteredBooks.slice(0, this.scrollCutOff);
      console.log('display', this.displayBooks.length - 5, this.displayBooks.length);
    }
  }

  private getListTpe() {
    this.listTpe = 'read';
    this.route
    .data
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      if (data && data.tpe) {
        this.listTpe = data.tpe;
        this.listTpeChanged.next(data.tpe);
      }
    });
  }

  private getDependables() {
    const options = {
      lan: this.userService.user.main.lan,
      component: 'StoriesComponent',
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
        this.setBookLanguages(dependables.bookLanguages);
        this.userLanguages = dependables.userLanguages;
        this.targetLanguage = this.userService.getUserLanguage(this.userLanguages);
        this.setPageName(this.listTpe);
        this.targetLanguageChanged = new BehaviorSubject(this.targetLanguage);
        this.filterUserLanguages();
        this.getBooks();
        this.isReady = true;
      }
    );
  }

  private setBookLanguages(bookLanguages: Language[]) {
    bookLanguages.map(lan => lan.interfaceName = this.text[lan.name]);
    bookLanguages.sort((a, b) => a.interfaceName > b.interfaceName ? 1 : b.interfaceName > a.interfaceName ? -1 : 0);
    this.bookLanguages = bookLanguages;
    this.bookLanguage = this.userService.getUserReadLanguage(this.bookLanguages);
  }

  private filterUserLanguages() {
    // filter out selected book language from the list of user languages to create target languages list
    this.targetLanguages = this.userLanguages.filter(lan => lan.code !== this.bookLanguage.code);
    this.targetLanguages.map(lan => lan.interfaceName = this.text[lan.name]);
    this.targetLanguages.sort((a, b) => a.interfaceName > b.interfaceName ? 1 : b.interfaceName > a.interfaceName ? -1 : 0);
    // check if current language is in list
    let isInList = this.targetLanguages.find(lan => lan.code === this.targetLanguage.code);
    if (!isInList) {
      // use user language
      const userLanCode = this.userService.user.main.myLan,
            userLan = this.targetLanguages.find(lan => lan.code === userLanCode);
      if (userLan) {
        this.targetLanguage = userLan;
      }
    }
    isInList = this.targetLanguages.find(lan => lan.code === this.targetLanguage.code);
    if (!isInList) {
      // use interface language
      const interfaceLanCode = this.userService.user.main.lan,
            interfaceLan = this.targetLanguages.find(lan => lan.code === interfaceLanCode);
      if (interfaceLan) {
        this.targetLanguage = interfaceLan;
      }
    }
    if (!isInList) {
      // use default fr if not book language - most common right now
      if (this.bookLanguage.code !== 'fr') {
        this.targetLanguage = this.targetLanguages.find(lan => lan.code === 'fr');
      } else {
        // else use the first in the list that if it is not the book language
        if (this.bookLanguage.code !== this.targetLanguages[0].code) {
          this.targetLanguage = this.targetLanguages[0];
        } else if (this.targetLanguages.length > 0) {
          this.targetLanguage = this.targetLanguages[1];
        }
      }
    }
    console.log('SET target lan', this.targetLanguage);
    this.targetLanguageChanged.next(this.targetLanguage);
  }

  private clearData() {
    this.displayBooks = [];

    this.isTranslationDataReady = false;
    this.isFinishedDataReady = false;
    this.isTypeDataReady = false;
    this.isLoading = false;

    this.translationCount = {};
    this.finishedTabs = {};
    this.userBookActivity = {};
    this.userBooks = {}; // For sorting
    this.userBooksTest = {};
    this.userData = [];
    this.userDataTest = [];
    this.bookWordCount = {}; // glossary translations count
    this.userWordCount = {}; // glossary count
    this.userWordData = {}; // glossary answer data
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
