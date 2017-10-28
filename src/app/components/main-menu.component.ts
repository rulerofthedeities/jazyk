import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, NavigationEnd} from '@angular/router';
import {UtilsService} from '../services/utils.service';
import {UserService} from '../services/user.service';
import {SharedService} from '../services/shared.service';
import {AuthService} from '../services/auth.service';
import {ErrorService} from '../services/error.service';
import {Translation} from '../models/course.model';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
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
  nrOfMessages = 0;

  constructor(
    private router: Router,
    private utilsService: UtilsService,
    private userService: UserService,
    private sharedService: SharedService,
    private authService: AuthService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getUrl();
    this.getTranslations(this.userService.user.main.lan);
    this.getNotificationsCount();
    this.checkMessages();
    this.userService.languageChanged.subscribe(
      newLan => this.getTranslations(newLan)
    );
    this.userService.notificationRead.subscribe(
      isAllRead => this.updateNotificationsUnReadCount(isAllRead)
    );
    this.userService.messageRead.subscribe(
      isAllRead => this.updateMessagesUnReadCount(isAllRead)
    );
    this.sharedService.justLoggedInOut.subscribe(
      loggedIn => {
        const interfaceLan = this.userService.user.main.lan;
        if (loggedIn) {
          this.getNotificationsCount();
          this.getMessagesCount();
        } else {
          // reset cached user data
          this.userService.getDefaultUserData(interfaceLan);
        }
        this.getTranslations(interfaceLan);
      }
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
      console.log('updating unread count notifications');
      this.userService
      .fetchNotificationsCount()
      .takeWhile(() => this.componentActive)
      .subscribe(
        count => this.nrOfNotifications = count,
        error => this.errorService.handleError(error)
      );
    }
  }

  private getMessagesCount() {
    if (this.isLoggedIn()) {
      console.log('updating unread count messages');
      this.userService
      .fetchMessagesCount()
      .takeWhile(() => this.componentActive)
      .subscribe(
        count => this.nrOfMessages = count,
        error => this.errorService.handleError(error)
      );
    }
  }

  private checkMessages() {
    TimerObservable
    .create(0, 900000) // Start immediately, then check every 15 minutes
    .takeWhile(() => this.componentActive)
    .subscribe(t => this.getMessagesCount());
  }

  private updateNotificationsUnReadCount(isAllRead: boolean) {
    console.log('update unread notifications count', isAllRead);
    if (isAllRead) {
      this.nrOfNotifications = 0;
    } else if (isAllRead === null) {
      this.getNotificationsCount();
    }  else if (this.nrOfNotifications > 0) {
      this.nrOfNotifications--;
    }
  }

  private updateMessagesUnReadCount(isAllRead: boolean) {
    console.log('update unread messages count', isAllRead);
    if (isAllRead) {
      this.nrOfMessages = 0;
    } else if (isAllRead === null) {
      this.getMessagesCount();
    }  else if (this.nrOfMessages > 0) {
      this.nrOfMessages--;
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
