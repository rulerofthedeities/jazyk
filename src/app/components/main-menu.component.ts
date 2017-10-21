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
  showDropDown = false;
  nrOfNotifications = 0;

  constructor(
    private router: Router,
    private utilsService: UtilsService,
    private userService: UserService,
    private authService: AuthService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getUrl();
    this.getTranslations(this.userService.user.main.lan);
    this.getNotificationsCount();
    this.userService.languageChanged.subscribe(
      newLan => this.getTranslations(newLan)
    );
    this.userService.notificationRead.subscribe(
      isAllRead => this.updateUnReadCount(isAllRead)
    );
  }

  onShowDropDown(show: boolean) {
    this.showDropDown = show;
  }

  onGoto(page: string) {
    event.preventDefault();
    this.showDropDown = false;
    this.router.navigate(['/user/', page]);
  }

  onLogOut() {
    event.preventDefault();
    this.authService.logout();
    this.userService.clearUser();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  private getUrl() {
    this.router.events
    .takeWhile(() => this.componentActive)
    .subscribe((route: NavigationEnd) => {
      this.url = route.url;
    });
  }

  private getNotificationsCount() {
    if (this.isLoggedIn()) {
      this.userService
      .fetchNotificationsCount()
      .takeWhile(() => this.componentActive)
      .subscribe(
        count => this.nrOfNotifications = count,
        error => this.errorService.handleError(error)
      );
    }
  }

  private updateUnReadCount(isAllRead: boolean) {
    if (isAllRead) {
      this.nrOfNotifications = 0;
    } else if (this.nrOfNotifications > 0) {
      this.nrOfNotifications--;
    }
  }

  private getTranslations(lan: string) {
    this.utilsService
    .fetchTranslations(lan, 'MainMenuComponent')
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
