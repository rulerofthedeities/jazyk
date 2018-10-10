import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Location, PlatformLocation } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReadnListenService } from '../../services/readnlisten.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { ErrorService } from '../../services/error.service';
import { SentenceSteps } from '../../models/book.model';
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
      readnListenService,
      sharedService,
      userService,
      errorService);
  }

  ngOnInit() {
    super.ngOnInit();
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
      case '1':
        if (this.currentStep === SentenceSteps.Question) {
          this.answer('yes');
        }
      break;
      case '2':
        if (this.currentStep === SentenceSteps.Question) {
          this.answer('maybe');
        }
      break;
      case '3':
      if (this.currentStep === SentenceSteps.Question) {
        this.answer('no');
      }
      break;
      case ' ':
        this.sharedService.pauseAudio();
      break;
    }
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
}
