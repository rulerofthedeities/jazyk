import {Component, OnInit, OnDestroy} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {UserService} from '../services/user.service';
import {UtilsService} from '../services/utils.service';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import {config} from '../app.config';
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
    private authService: AuthService,
    private userService: UserService,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.setBackgroundMonth();
    this.setUpTokenRefresh();
    this.setUserLan();
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

  private setUserLan() {
    // If user is logged in, get from user settings
    // if not logged in or not in user settings, get from url parm
    // if not in url parm, get from navigator
    let lan = null;

    // if not in url parm, get from navigator
    if (!lan) {
      lan = this.validateLan(navigator.language.slice(0, 2));
    }
    // if not in navigator, get from config
    lan = lan || config.language;
    this.userService.setInterfaceLan(lan);
    console.log('interface lan', lan);
  }

  private validateLan(lan: string): string {
    const interfaceLanguages = this.utilsService.getActiveLanguages();
    const acceptedLanguage = interfaceLanguages.find(language => language._id === lan);
    console.log('acceptedLanguage', lan, acceptedLanguage, interfaceLanguages);
    if (acceptedLanguage) {
      return lan;
    } else {
      return null;
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
