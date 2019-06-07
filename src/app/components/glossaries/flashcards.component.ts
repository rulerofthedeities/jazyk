import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SharedService } from 'app/services/shared.service';
import { ReadnListenService } from 'app/services/readnlisten.service';
import { UserService } from 'app/services/user.service';
import { Book } from 'app/models/book.model';
import { ReadSettings } from 'app/models/user.model';
import { takeWhile, filter } from 'rxjs/operators';

@Component({
  selector: 'km-flashcards',
  templateUrl: 'flashcards.component.html',
  styleUrls: ['flashcards.component.css']
})

export class BookFlashcardsComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object;
  isCountDown = false;
  settings: ReadSettings;
  bookId: string;
  userLanCode: string;
  book: Book;
  isReady = false;
  startedExercises = false;

  constructor(
    private route: ActivatedRoute,
    private sharedService: SharedService,
    private readnListenService: ReadnListenService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.settings = this.userService.user.jazyk.read;
    this.getDependables(this.userService.user.main.lan);
  }

  onCountDownFinished() {
    this.isCountDown = false;
  }

  onExitReading() {
    console.log('exiting');
    this.exitReading();
  }

  private getBookId() {
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.id))
    .subscribe(
      params => {
        this.bookId = params['id'];
        this.userLanCode = params['lan'];
        this.processNewBookId();
      }
    );
  }

  private processNewBookId() {
    console.log('process book id');
    this.readnListenService
    .fetchBook(this.bookId, 'read')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      book => {
        this.book = book;
        if (this.book) {
          this.isCountDown = true;
          this.isReady = true;
          this.startedExercises = true;
          this.sharedService.changeExerciseMode(true);
        }
      }
    );
  }

  private exitReading() {
    let abortNow = false;
    if (this.isCountDown) {
      this.isCountDown = false;
      this.log('Countdown aborted');
      abortNow = true;
    } else {
      this.log('Flashcards aborted');
      abortNow = true;
    }
    if (abortNow) {
      this.sharedService.changeExerciseMode(false);
      this.sharedService.stopAudio();
    }
  }

  private getDependables(lan) {
    const options = {
      lan,
      component: 'WordListComponent',
      getTranslations: true
    };

    this.sharedService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.text = this.sharedService.getTranslatedText(dependables.translations);
        this.sharedService.setPageTitle(this.text, 'Flashcards');
        this.getBookId();
      }
    );
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'BookFlashcardsComponent'
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
