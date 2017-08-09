import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, NavigationEnd} from '@angular/router';
import {UtilsService} from '../services/utils.service';
import {UserService} from '../services/user.service';
import {AuthService} from '../services/auth.service';
import {ErrorService} from '../services/error.service';
import {Translation} from '../models/course.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-main-menu',
  templateUrl: 'main-menu.component.html',
  styles: [`
    .logo img {
      margin: 2px 10px;
    }
    .navbar-earthy {
      background: #41474b;
      background: linear-gradient(0deg, #2c3033, #41474b, #41474b);
      color: #ddd;
      font-size: 24px;
    }
    .navbar-earthy a {
      color: #ddd;
    }
    .navbar-earthy .nav > li > a:hover, .nav > li > a:focus {
      color: black;
    }
    nav {
      box-shadow: 0px 4px 6px rgba(20, 20, 20, 0.3);
    }
    .login {
      margin-right: 15px;
    }
  `]
})

export class MainMenuComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private url: string;
  text: Object = {};

  constructor(
    private router: Router,
    private utilsService: UtilsService,
    private userService: UserService,
    private authService: AuthService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getUrl();
    this.getTranslations();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logOut() {
    this.authService.logout();
  }

  private getUrl() {
    this.router.events
    .takeWhile(() => this.componentActive)
    .subscribe((route: NavigationEnd) => {
      this.url = route.url;
    });
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.userService.user.lan, 'MainMenuComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => this.text = this.utilsService.getTranslatedText(translations),
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
