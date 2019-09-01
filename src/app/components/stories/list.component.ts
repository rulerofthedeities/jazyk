import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { StoriesService } from 'app/services/stories.service';
import { FilterService } from 'app/services/filter.service';
import { Map, Language, LicenseUrl } from '../../models/main.model';
import { Book, UserBookActivity, UserBookLean, UserData, TranslationData,
        FinishedData, FinishedTab, ViewFilter, StoryData } from '../../models/book.model';
import { UserWordCount, UserWordData } from '../../models/word.model';
import { takeWhile, filter, delay } from 'rxjs/operators';
import { zip, of, BehaviorSubject } from 'rxjs';

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
  isWordDataReady = false;
  isLoading = false;
  isMyList = false;
  isSingleBook = false;
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
  userData: Map<UserData>[] = [];
  userDataTest: Map<UserData>[] = [];
  bookWordCount: Map<UserWordCount> = {}; // glossary translations count
  userWordCount: Map<UserWordCount> = {}; // glossary count
  userWordData: Map<UserWordData> = {}; // glossary answer data
  nrOfBooks: number;
  scrollCutOff = 10; // nr of books shown
  initScrollCutOff = 10;
  scrollDelta = 5;
  itemTxt: string; // filter
  showFilter: boolean;
  filterChanged: BehaviorSubject<boolean> = new BehaviorSubject(false);
  listTpeChanged: BehaviorSubject<string> = new BehaviorSubject('read');
  targetLanguageChanged: BehaviorSubject<Language>;
  dataLoaded: Map<BehaviorSubject<StoryData>> = {};

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
    this.getDependables();
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
    this.getPostActivityData();
  }

  onChangeMyList(tpe: string) {
    this.isMyList = tpe === 'my';
    this.filterBooks();
    this.getTypeData();
  }

  onChangeSort(newSort: string) {
    this.filterService.sort[this.listTpe] = newSort;
    this.getBooks(false);
  }

  onChangeFilter(newFilter: ViewFilter) {
    this.filterService.filter[this.listTpe] = newFilter;
    this.filterBooks();
  }

  onScrollBooksDown() {
    this.scrollCutOff += this.scrollDelta;
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

  private setPageName(tpe: string) {
    let titleKey = 'Stories';
    titleKey += this.listTpe;
    this.sharedService.setPageTitle(this.text, titleKey);
  }

  private getBooks(onlyBooks = false) {
    this.filteredBooks = [];
    this.isLoading = true;
    this.isBooksReady = false;
    zip(
      this.storiesService.fetchPublishedBooks(this.bookLanguage.code, this.filterService.sort[this.listTpe]),
      onlyBooks ? of([]) : this.storiesService.fetchActivity()
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      data => {
        this.books = data[0];
        this.displayBooks = [];
        if (this.books && this.books.length) {
          this.nrOfBooks = this.books.length;
          this.filterBooks();
        }
        if (data[1] && data[1].length) {
          this.processActivity(data[1]);
        }
        this.books.forEach(book => {
          this.dataLoaded[book._id] = new BehaviorSubject(null);
        });
        this.isBooksReady = true;
        this.isLoading = false;
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
        this.storiesService.fetchUserBooks(this.targetLanguage.code),
        this.storiesService.fetchSessionData(this.targetLanguage.code, this.listTpe)
      )
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(data => {
        if (data && data.length) {
          this.processUserBooks(data[0]);
          this.processSessionData(data[1]);
        }
        this.isTypeDataReady = true;
        this.checkAllDataLoaded();
      });
    } else {
      zip(
        this.storiesService.fetchUserBooks(this.targetLanguage.code),
        this.storiesService.fetchUserWords(this.targetLanguage.code)
      )
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(data => {
        if (data && data.length) {
          this.processUserBooks(data[0]);
          this.processUserWordData(data[1]);
        }
        this.isTypeDataReady = true;
        this.checkAllDataLoaded();
      });
    }
  }

  private checkAllDataLoaded() {
    if (this.listTpe === 'glossary') {
      if (this.isTypeDataReady && this.isFinishedDataReady && this.isWordDataReady) {
        this.sendDataToStory();
      }
    } else {
      if (this.isTypeDataReady && this.isFinishedDataReady && this.isTranslationDataReady) {
        this.sendDataToStory();
      }
    }
  }

  private sendDataToStory() {
    // Put all data in one object per story
    let story: StoryData,
        bookId: string;
    console.log('>>SENDING DATA');
    this.filteredBooks.forEach(book => {
      bookId = book._id;
      story = {
        userBook: this.userBooks[bookId],
        userBookTest: this.userBooksTest[bookId],
        userData: this.userData[bookId],
        userDataTest: this.userDataTest[bookId],
        translationCount: this.translationCount[bookId],
        userGlossaryCount: this.userWordCount[bookId],
        userGlossaryData: this.userWordData[bookId],
        glossaryCount: this.bookWordCount[bookId]
      };
      this.dataLoaded[bookId].next(story);
    });
  }

  private getWordData() {
    zip(
      this.storiesService.fetchUserWordCounts(this.bookLanguage.code, this.targetLanguage.code),
      this.storiesService.fetchBookWordCounts(this.bookLanguage.code, this.targetLanguage.code)
    )
    .pipe(takeWhile(() => this.componentActive), delay(2000))
    .subscribe(data => {
      if (data && data.length) {
        this.processUserWordCount(data[0]);
        this.processWordTranslations(data[1]);
        this.processFinishedGlossary();
      }
      console.log('word data loaded', this.bookWordCount);
      this.isWordDataReady = true;
      this.checkAllDataLoaded();
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
      this.userWordData[key].lastAnswerMyYes = 0;
      this.userWordData[key].lastAnswerAllYes = 0;
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
      this.checkAllDataLoaded();
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
      this.checkAllDataLoaded();
    });
  }

  private processFinishedData(finishedData: FinishedData[]) {
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
          /*
        case 'glossary':
          this.finishedTabs[finished.bookId].glossary = !!finished.isFinished;
          break;
          */
      }
    });
  }

  private processFinishedGlossary() {
    const glossaryBooks = this.books.filter(book => book.wordListPublished);
    glossaryBooks.forEach(book => {
      if (this.userBooks[book._id] && this.userBooks[book._id].bookmark && this.userBooks[book._id].bookmark.lastGlossaryType) {
        const glossaryType = this.userBooks[book._id].bookmark.lastGlossaryType;
        let totalWords: number,
            userWords: number;
        if (glossaryType === 'my') {
          if (this.bookWordCount[book._id]) {
            totalWords = this.userWordCount[book._id].countTranslation;
          }
          if (this.userWordData[book._id]) {
            userWords = this.userWordData[book._id].lastAnswerMyYes;
          }
        } else {
          if (this.userWordCount[book._id]) {
            totalWords = this.bookWordCount[book._id].countTranslation;
          }
          if (this.userWordData[book._id]) {
            userWords = this.userWordData[book._id].lastAnswerAllYes;
          }
        }
        if (userWords >= totalWords) {
          if (this.finishedTabs[book._id]) {
            this.finishedTabs[book._id].glossary = true;
          } else {
            this.finishedTabs[book._id] = {
              read: false,
              listen: false,
              listenDefault: false,
              listenTest: false,
              glossary: true
            };
          }
        }
      }
    });
  }

  private processUserBooks(uBooks: UserBookLean[]) {
    // Then filter out user books for current type
    const uBooksCurrentType = uBooks.filter(uBook => uBook.bookType === this.listTpe);
    let allUBooks: UserBookLean[];
    this.userBooks = {};
    this.userBooksTest = {};
    uBooksCurrentType.forEach(uBook => {
      // Map userbook per book id
      if (uBook.isTest) {
        this.userBooksTest[uBook.bookId] = uBook;
      } else {
        // Merge thumbs and recommends per book into current type
        allUBooks = uBooks.filter(auBook => auBook.bookId === uBook.bookId);
        if (allUBooks.length > 1) {
          uBook.recommended = !!allUBooks.find(auBook => auBook.recommended);
          uBook.subscribed = !!allUBooks.find(auBook => auBook.subscribed);
        }
        this.userBooks[uBook.bookId] = uBook;
      }
      delete uBook.bookId;
    });
    uBooks = undefined;
    if (this.isMyList || (this.filterService.filter[this.listTpe] && this.filterService.filter[this.listTpe].hideCompleted)) {
      this.filterBooks();
    }
  }

  private processSessionData(sessionData: UserData[]) {
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
    if (!this.nrOfBooks) {
      this.filteredBooks = [];
      return;
    }
    // List Type: read, listen or glossary
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
          currentFilter = this.filterService.filter[this.listTpe];
    let filteredBook: Book;

    this.isSingleBook = false;
    if (currentFilter) {
      if (currentFilter.bookId) {
        // Check if book with this bookId exists
        filteredBook = this.books.find(book => book._id.toString() === currentFilter.bookId);
      }
      if (filteredBook) {
        console.log('Show only filtered book', filteredBook);
        this.filteredBooks = [filteredBook];
        this.isSingleBook = true;
      } else {
        if (currentFilter.hideCompleted) {
          this.filteredBooks = this.filteredBooks.filter(b =>
            !(this.userBooks[b._id] && this.userBooks[b._id].bookmark &&
              (this.userBooks[b._id].bookmark.isBookRead || (this.userBooks[b._id].repeatCount || 0 > 0)))
          );
          filters.push(this.text['CompletedOnly']);
        }
        if (currentFilter.hideNotTranslated) {
          this.filteredBooks = this.filteredBooks.filter(b => {
            const bookId = b.bookId ? b.bookId : b._id;
            return this.translationCount[bookId] >= b.difficulty.nrOfUniqueSentences;
          });
          filters.push(this.text['TranslatedOnly']);
        }
        if (currentFilter.hideOld) {
          this.filteredBooks = this.filteredBooks.filter(b => b.year >= 1945);
          filters.push(this.text['ModernOnly']);
        }
        if (currentFilter.hideEasy) {
          this.filteredBooks = this.filteredBooks.filter(b => b.difficulty.weight > 400);
        }
        if (currentFilter.hideAdvanced) {
          this.filteredBooks = this.filteredBooks.filter(b => b.difficulty.weight < 480);
        }
        if (currentFilter.hideMedium) {
          this.filteredBooks = this.filteredBooks.filter(b => b.difficulty.weight <= 400 || b.difficulty.weight >= 480);
        }
        if (currentFilter.hideEasy && currentFilter.hideMedium && !currentFilter.hideAdvanced) {
          filters.push(this.text['AdvancedOnly']);
        }
        if (currentFilter.hideEasy && !currentFilter.hideMedium && !currentFilter.hideAdvanced) {
          filters.push(this.text['AdvancedMediumOnly']);
        }
        if (currentFilter.hideEasy && !currentFilter.hideMedium && currentFilter.hideAdvanced) {
          filters.push(this.text['MediumOnly']);
        }
        if (!currentFilter.hideEasy && currentFilter.hideMedium && currentFilter.hideAdvanced) {
          filters.push(this.text['EasyOnly']);
        }
        if (!currentFilter.hideEasy && !currentFilter.hideMedium && currentFilter.hideAdvanced) {
          filters.push(this.text['EasyMediumOnly']);
        }
        if (!currentFilter.hideEasy && currentFilter.hideMedium && !currentFilter.hideAdvanced) {
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
    }
  }

  private getListTpe() {
    this.listTpe = 'read';
    this.route.data
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      if (data && data.tpe) {
        this.listTpe = data.tpe;
        this.listTpeChanged.next(data.tpe);
        this.setFilter();
      }
    });
  }

  private setFilter() {
    this.filterService.initFilter(this.listTpe);
    this.filterService.initSort(this.listTpe);
    console.log('set filter');
    this.route.queryParams
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.id))
    .subscribe(
      params => {
        console.log('got id', params['id']);
        if (params['id']) {
          this.filterService.setBookId(params['id'], this.listTpe);
          this.location.go(`/${this.listTpe}`);
        }
      }
    );
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
    this.targetLanguageChanged.next(this.targetLanguage);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
