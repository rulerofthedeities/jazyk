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
  styleUrls: ['main-menu.component.css']
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
    this.userService.clearUser();
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
