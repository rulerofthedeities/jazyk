import { Component, OnInit } from '@angular/core';
import { Location, PlatformLocation } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReadService } from '../../services/read.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { ErrorService } from '../../services/error.service';
import { ReadnListenSentencesComponent } from '../../abstracts/readnlisten-sentences.abstract';

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
}
