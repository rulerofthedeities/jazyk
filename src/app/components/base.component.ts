import {Component, OnInit, OnDestroy} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {UtilsService} from '../services/utils.service';
import {UserService} from '../services/user.service';
import {SharedService} from '../services/shared.service';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import 'rxjs/add/operator/takeWhile';

@Component({
  template: `
  <div class="corner-ribbon top-right sticky red shadow" *ngIf="!exercisesStarted">alpha version</div>
  <img src="/assets/img/backgrounds/{{this.month}}.jpg" *ngIf="showBackground">
  <div class="container">
    <km-main-menu *ngIf="!exercisesStarted"></km-main-menu>
    <div class="main" [class.margin]="!exercisesStarted">
      <router-outlet></router-outlet>
    </div>
    <km-footer *ngIf="!exercisesStarted"></km-footer>
  </div>
  `,
  styleUrls: ['base.component.css']
})

export class BaseComponent implements OnInit, OnDestroy {
  private componentActive = true;
  month: string;
  exercisesStarted = false;
  showBackground: Boolean;

  constructor (
    private authService: AuthService,
    private userService: UserService,
    private sharedService: SharedService,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.showBackground = this.userService.user.main.background;
    this.setBackgroundMonth();
    this.setUpTokenRefresh();
    this.sharedService.exerciseModeChanged.subscribe(
      started => this.exercisesStarted = started
    );
    this.userService.backgroundChanged.subscribe(
      status => this.showBackground = status
    );
    this.sharedService.justLoggedInOut.subscribe(
      (loggedIn) => {
        if (loggedIn) {
          this.showBackground = this.userService.user.main.background;
        } else {
          this.showBackground = true;
        }
      }
    );
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
