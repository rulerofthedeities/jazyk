import { Component, OnInit } from '@angular/core';
import { Location, PlatformLocation } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReadService } from '../../services/read.service';
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

  onAnswered(answer: TestAnswer) {
    console.log('answer parent', answer);
    this.currentStep = SentenceSteps.Answered;
    this.currentAnswer = answer.word;
    this.sessionData.answers += answer.answerLetter;
    this.sessionData.points.words += this.getSentencePoints(answer);
    this.sessionData.nrYes += answer.answerLetter === 'y' ? 1 : 0 ;
    this.sessionData.nrMaybe += answer.answerLetter === 'm' ? 1 : 0 ;
    this.sessionData.nrNo += answer.answerLetter === 'n' ? 1 : 0 ;
    this.currentStep = SentenceSteps.Translations;
    console.log(this.sessionData);
    this.answersObservable.next({answers: this.sessionData.answers, isResults: false});
  }

  getSentencePoints(answer: TestAnswer) {
    let points = 0;
    if (answer.answerLetter === 'y') {
      points += 2;
      points += Math.round((1000 - answer.score) / 100); // difficulty
      points += answer.word.length; // word length
    } else if (answer.answerLetter === 'm') {
      points += 1;
      points += Math.round((1000 - answer.score) / 200); // difficulty
    }
    return points;
  }
}
