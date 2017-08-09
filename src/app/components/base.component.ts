import {Component, OnInit, OnDestroy} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {UtilsService} from '../services/utils.service';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import 'rxjs/add/operator/takeWhile';

@Component({
  template: `
  <img src="/assets/img/backgrounds/{{this.month}}.jpg">
  <div class="container">
    <km-main-menu></km-main-menu>
    <div class="main">
      <router-outlet></router-outlet>
    </div>
  </div>
  `,
  styleUrls: ['base.component.css']
})

export class BaseComponent implements OnInit, OnDestroy {
  private componentActive = true;
  month: string;

  constructor (
    private authService: AuthService,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.setBackgroundMonth();
    this.setUpTokenRefresh();
  }

  private setBackgroundMonth() {
    const dt = new Date();
    const y = dt.getFullYear();
    const m = ('0' + (dt.getMonth() + 1)).slice(-2);
    this.month = y + m;
  }

  private setUpTokenRefresh() {
    const timer = TimerObservable.create(30000, 3600000); // Start after 30 secs, then check every hour
    timer
    .takeWhile(() => this.componentActive)
    .subscribe(t => {
      if (this.authService.isLoggedIn()) {
        this.authService.keepTokenFresh();
      }
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
