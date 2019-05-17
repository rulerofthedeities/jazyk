import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { FilterService } from 'app/services/filter.service';
import { ReadnListenListComponent } from '../../abstracts/readnListen-list.abstract';
import { Book } from '../../models/book.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  templateUrl: 'read.component.html',
  styleUrls: ['read.component.css']
})

export class ReadComponent extends ReadnListenListComponent implements OnInit, OnDestroy {

  constructor(
    readnListenService: ReadnListenService,
    userService: UserService,
    sharedService: SharedService,
    filterService: FilterService
  ) {
    super(
      readnListenService,
      userService,
      sharedService,
      filterService
    );
  }

  ngOnInit() {
    this.bookType = 'read';
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
    .fetchPublishedBooks(this.bookLanguage.code, this.filterService.sort[this.bookType])
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
}
