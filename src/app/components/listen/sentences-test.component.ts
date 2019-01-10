import { Component } from '@angular/core';
import { Location, PlatformLocation } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReadnListenService } from '../../services/readnlisten.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { ErrorService } from '../../services/error.service';
import { ReadnListenSentencesComponent } from '../../abstracts/readnlisten-sentences.abstract';
import { TestAnswer, SentenceSteps } from '../../models/book.model';

@Component({
  templateUrl: 'sentences-test.component.html',
  styleUrls: ['../readnlisten/book-sentences.component.css']
})

export class SentencesTestComponent extends ReadnListenSentencesComponent {

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

  onKeyPressed(key: string) {
    switch (key) {
      case 'Escape':
        if (this.currentStep < SentenceSteps.Results) {
          this.exitReading();
        }
      break;
      /*
      case ' ':
        this.sharedService.pauseAudio();
      break;
      */
    }
  }

  onAnswered(answer: TestAnswer) {
    this.currentStep = SentenceSteps.Answered;
    this.currentAnswer = answer.word;
    this.sessionData.answers += answer.answerLetter;
    this.sessionData.points.words += this.getSentencePoints(this.currentSentenceTxt);
    this.sessionData.points.test += this.getSentenceTestPoints(answer);
    this.sessionData.nrYes += answer.answerLetter === 'y' ? 1 : 0 ;
    this.sessionData.nrMaybe += answer.answerLetter === 'm' ? 1 : 0 ;
    this.sessionData.nrNo += answer.answerLetter === 'n' ? 1 : 0 ;
    this.currentStep = SentenceSteps.Translations;
    this.saveBookmarkAndSession();
    this.answersObservable.next({answers: this.sessionData.answers, isResults: false});
  }

  getSentenceTestPoints(answer: TestAnswer) {
    let points = 0;
    if (answer.answerLetter === 'y') {
      points += 3;
      points += (1000 - answer.score) / 80; // difficulty
      points += answer.word.length * 1.2; // word length
    } else if (answer.answerLetter === 'm') {
      points += 1;
      points += (1000 - answer.score) / 160; // difficulty
    }
    return Math.round(points * 14);
  }
}
