import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReadService } from '../../services/read.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { ReadnListenService } from '../../services/readnlisten.service';
import { ReadnListenComponent } from '../readnlisten/readnListen.component';

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
    this.tpe = 'listen';
    this.getDependables();
  }
}
