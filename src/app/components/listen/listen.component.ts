import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { ReadnListenListComponent } from '../../abstracts/readnListen-list.abstract';
import { takeWhile } from 'rxjs/operators';

@Component({
  templateUrl: 'listen.component.html',
  styleUrls: ['listen.component.css']
})

export class ListenComponent extends ReadnListenListComponent implements OnInit, OnDestroy {

  constructor(
    readnListenService: ReadnListenService,
    userService: UserService,
    sharedService: SharedService
  ) {
    super(readnListenService, userService, sharedService);
  }

  ngOnInit() {
    this.bookType = 'listen';
    this.getDependables();
  }

  protected getBooks(onlyBooks = false) {
    if (!onlyBooks) { // Not required if resorted
      this.getUserBooks();
      this.getUserData();
      this.getBookTranslations();
    }
    this.isLoading = true;
    this.readnListenService
    .fetchPublishedAudioBooks(this.bookLanguage.code, this.sort)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      books => {
        this.books = books;
        if (books) {
          this.nrOfBooks = books.length;
          this.filterBooks();
        }
        this.isLoading = false;
        this.isBooksReady = true;
      }
    );
  }
}
