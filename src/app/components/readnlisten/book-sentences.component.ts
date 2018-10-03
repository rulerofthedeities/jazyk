import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Location, PlatformLocation } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReadService } from '../../services/read.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { ErrorService } from '../../services/error.service';
import { zip, BehaviorSubject, Subject } from 'rxjs';
import { takeWhile, filter } from 'rxjs/operators';
import { ReadSettings } from '../../models/user.model';
import { UserBook, Bookmark, SessionData,
         Book, Chapter, Sentence, SentenceSteps } from '../../models/book.model';
import { ReadnListenSentencesComponent } from '../../abstracts/readnlisten-sentences.abstract';

@Component({
  templateUrl: 'book-sentences.component.html',
  styleUrls: ['book-sentences.component.css']
})

export class BookSentencesComponent extends ReadnListenSentencesComponent implements OnInit, OnDestroy {

  constructor(
    route: ActivatedRoute,
    router: Router,
    location: Location,
    platformLocation: PlatformLocation,
    readService: ReadService,
    readnListenService: ReadnListenService,
    sharedService: SharedService,
    userService: UserService,
    errorService: ErrorService
  ) {
    super(
      route,
      router,
      location,
      platformLocation,
      readService,
      readnListenService,
      sharedService,
      userService,
      errorService);
  }

  ngOnInit() {
    super.ngOnInit();
    this.observe();
  }

  onAnswer(answer: string) {
    this.answer(answer);
  }

  onKeyPressed(key: string) {
    switch (key) {
      case 'Escape':
        if (this.currentStep < SentenceSteps.Results) {
          this.exitReading();
        }
      break;
      case 'Backspace':
      if (this.currentStep === SentenceSteps.Question) {
        this.answer('no');
      }
      break;
      case ' ':
        if (this.currentStep === SentenceSteps.Question) {
          this.answer('yes');
        }
      break;
    }
  }

  private observe() {
    // New book started from suggestions?
    this.readService
    .readAnotherBook.subscribe(
      book => {
        if (this.currentStep === SentenceSteps.Results) {
          // Results - already saved
          this.startAnotherBook(book);
        } else {
          this.placeBookmark(false);
          this.saveSessionData(book);
        }
      }
    );
    // If back button, show header
    this.platformLocation.onPopState(() => {
      this.sharedService.changeExerciseMode(false);
    });
  }

  private answer(answer: string) {
    this.currentStep = SentenceSteps.Answered;
    this.currentAnswer = answer;
    this.sessionData.answers += answer.substr(0, 1);
    this.sessionData.points.words += this.getSentencePoints(this.currentSentence.text);
    switch (answer) {
      case 'yes':
        this.sessionData.nrYes++;
        break;
      case 'no':
        this.sessionData.nrNo++;
        break;
      case 'maybe':
        this.sessionData.nrMaybe++;
        break;
    }
    this.saveBookmarkAndSession();
    this.currentStep = SentenceSteps.Translations;
    this.answersObservable.next({answers: this.sessionData.answers, isResults: false});
  }

  private getSentencePoints(sentence: string): number {
    const words = sentence.split(' ');
    return words ? Math.round(words.length * this.getScoreMultiplier()) : 0;
  }

}
