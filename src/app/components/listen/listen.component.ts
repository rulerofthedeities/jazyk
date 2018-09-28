import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReadService } from '../../services/read.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { ReadnListenComponent } from '../readnlisten/readnListen.component';
import { takeWhile } from 'rxjs/operators';

@Component({
  templateUrl: 'listen.component.html',
  styleUrls: ['listen.component.css']
})

export class ListenComponent extends ReadnListenComponent implements OnInit, OnDestroy {

  constructor(
    readService: ReadService,
    readnListenService: ReadnListenService,
    userService: UserService,
    sharedService: SharedService
  ) {
    super(readService, readnListenService, userService, sharedService);
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
        this.IsBooksReady = true;
      }
    );
  }
}
