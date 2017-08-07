import {Component, OnInit, OnDestroy} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-jazyk',
  template: `
  <img src="/assets/img/backgrounds/{{this.month}}.jpg">
  <div class="container">
    <km-main-menu></km-main-menu>
    <div class="main">
      <router-outlet></router-outlet>
    </div>
  </div>
  `,
  styleUrls: ['app.component.css']
})

export class AppComponent implements OnInit, OnDestroy {
  private componentActive = true;
  month: string;

  constructor (
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.setBackgroundMonth();
    this.setUpTokenRefresh();
    this.getUserLan();
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

  private getUserLan() {
    // If user is logged in, get from user settings
    // if not logged in or not in user settings, get from url parm
    // if not in url parm, get from navigator
    // if not in navigator, get from config
    const lan = navigator.language;
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
