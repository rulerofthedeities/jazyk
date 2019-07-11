import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { FilterService } from 'app/services/filter.service';
import { ReadnListenListComponent } from '../../abstracts/readnListen-list.abstract';
import { WordListService } from '../../services/word-list.service';
import { Map } from '../../models/main.model';
import { Book } from '../../models/book.model';
import { UserWordData } from '../../models/word.model';
import { takeWhile } from 'rxjs/operators';
import { zip } from 'rxjs';

@Component({
  templateUrl: 'glossaries.component.html',
  styleUrls: ['glossaries.component.css']
})

export class GlossariesComponent extends ReadnListenListComponent implements OnInit, OnDestroy {
  bookWordData: Map<UserWordData> = {}; // glossary translations

  constructor(
    readnListenService: ReadnListenService,
    userService: UserService,
    sharedService: SharedService,
    filterService: FilterService,
    private wordListService: WordListService,
  ) {
    super(
      readnListenService,
      userService,
      sharedService,
      filterService
    );
  }

  ngOnInit() {
    this.bookType = 'glossary';
    this.filterService.initFilter(this.bookType);
    this.filterService.initSort(this.bookType);
    this.getDependables();
  }

  onRemovedSubscription(book: Book) {
    this.userBooks[book._id].subscribed = false;
    this.filterBooks();
  }

  protected getBooks(onlyBooks = false) {
    if (!onlyBooks) { // Not required if resorted
      this.getAllUserData();
    }
    this.filteredBooks = [];
    this.isLoading = true;
    this.readnListenService
    .fetchPublishedGlossaries(this.bookLanguage.code, this.filterService.sort[this.bookType])
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      books => {
        this.books = books;
        if (books && books.length) {
          this.nrOfBooks = books.length;
          this.filterBooks();
        } else {
          this.displayBooks = [];
        }
        this.isLoading = false;
        this.isBooksReady = true;
      }
    );
  }

  protected getAllUserData() {
    this.isBooksReady = false;
    zip(
      this.readnListenService.fetchUserBooks(this.myLanguage.code, this.bookType),
      this.wordListService.fetchUserWordCounts(this.bookLanguage.code, this.myLanguage.code),
      this.wordListService.fetchBookWordCounts(this.bookLanguage.code, this.myLanguage.code)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(data => {
      if (data && data.length) {
        this.processUserBooks(data[0]);
        this.processUserWordData(data[1]);
        this.processWordTranslations(data[2]);
        // this.processActivity(data[3]);
      }
      this.isBooksReady = true;
    });
  }

  private processUserWordData(userwords: UserWordData[]) {
    // First clear data (if different language has been selected)
    Object.keys(this.userWordData).forEach((key, index) => {
      this.userWordData[key].countTotal = 0;
      this.userWordData[key].countTranslation = 0;
    });
    // Add new data
    userwords.forEach(count => {
      this.userWordData[count.bookId] = count;
    });
  }

  private processWordTranslations(translations: UserWordData[]) {
    // First clear data (if different language has been selected)
    Object.keys(this.bookWordData).forEach((key, index) => {
      this.bookWordData[key].countTotal = 0;
      this.bookWordData[key].countTranslation = 0;
    });

    // Add new data
    translations.forEach(count => {
      this.bookWordData[count.bookId] = count;
    });
  }
}
