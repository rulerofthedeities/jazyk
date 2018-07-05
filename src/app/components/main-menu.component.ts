import {Component, OnInit, OnDestroy} from '@angular/core';
import {Router, NavigationEnd} from '@angular/router';
import {UtilsService} from '../services/utils.service';
import {UserService} from '../services/user.service';
import {SharedService} from '../services/shared.service';
import {AuthService} from '../services/auth.service';
import {ErrorService} from '../services/error.service';
import {User} from '../models/user.model';
import {Language} from '../models/course.model';
import {timer} from 'rxjs';
import {takeWhile} from 'rxjs/operators';

@Component({
  selector: 'km-main-menu',
  templateUrl: 'main-menu.component.html',
  styleUrls: ['main-menu.component.css']
})

export class MainMenuComponent implements OnInit, OnDestroy {
  private componentActive = true;
  url: string;
  text: Object = {};
  showDropDown = false;
  nrOfNotifications = 0;
  nrOfMessages = 0;
  score: number;
  rank: number;
  intLan: Language;
  intLans: Language[];
  isReady = false;
  isLoggedIn = false;
  rankColor = 'w';

  constructor(
    private router: Router,
    private utilsService: UtilsService,
    private userService: UserService,
    private sharedService: SharedService,
    private authService: AuthService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.getUrl();
    this.getDependables();
    this.getNotificationsCount();
    this.checkMessages();
    this.getScoreCount();
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
        this.nrOfMessages = 0;
        this.nrOfNotifications = 0;
        this.showDropDown = false;
        this.isLoggedIn = loggedIn;
        if (loggedIn) {
          this.setInterfaceLan();
          this.getNotificationsCount();
          this.getMessagesCount();
          this.getScoreCount();
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

  onGoto(event: MouseEvent, page: string) {
    event.preventDefault();
    this.showDropDown = false;
    this.router.navigate(['/user/', page]);
  }

  onSelectLanguage(newInterfaceLan: Language) {
    this.log(`Change interface language to ${newInterfaceLan.name}`);
    this.updateInterfaceLan(newInterfaceLan);
  }

  onLogOut(event: MouseEvent) {
    event.preventDefault();
    this.log('Logging out');
    this.authService.logout(event);
    this.userService.clearUser();
  }

  getUser(): User {
    return this.userService.user;
  }

  onChangeRankColor(event: MouseEvent) {
    this.rankColor = event.type === 'mouseover' ? 'b' : 'w';
  }

  getRankColor(): string {
    return this.rank < 5 ? this.rankColor : '';
  }

  private getUrl() {
    this.url = this.filterUrl(this.router.url);
    this.router.events
    .pipe(takeWhile(() => this.componentActive))
    .subscribe((route: NavigationEnd) => {
      this.url = this.filterUrl(route.url);
    });
  }

  filterUrl(url: string): string {
    // /-> /home
    if (url === '/') {
      url = '/home';
    } else {
      if (url && url.substr(0, 12).toLowerCase() === '/auth/signin') {
        url = '/auth/signin'; // clear path
      }
    }
    return url;
  }

  private setInterfaceLan() {
    const lan = this.userService.user.main.lan;
    this.intLan = this.intLans.find(lanItem => lanItem.code === lan);
  }

  private updateInterfaceLan(newLan: Language) {
    this.userService.user.main.lan = newLan.code;
    localStorage.setItem('km-jazyk.lan', newLan.code);
    this.intLan = newLan;
    this.showDropDown = false;
    this.userService.languageChanged.emit(newLan.code);
  }

  private getNotificationsCount() {
    if (this.isLoggedIn) {
      this.userService
      .fetchNotificationsCount()
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        count => this.nrOfNotifications = count,
        error => this.errorService.handleError(error)
      );
    }
  }

  private getMessagesCount() {
    if (this.isLoggedIn) {
      this.userService
      .fetchMessagesCount()
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        count => this.nrOfMessages = count,
        error => this.errorService.handleError(error)
      );
    }
  }

  private getScoreCount() {
    if (this.isLoggedIn) {
      this.userService
      .fetchScoreTotal()
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        score => {
          this.score = score || 0;
          this.rank = this.utilsService.getRank(this.score);
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  private checkMessages() {
    timer(0, 900000) // Start immediately, then check every 15 minutes
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(t => this.getMessagesCount());
  }

  private updateNotificationsUnReadCount(isAllRead: boolean) {
    if (isAllRead) {
      this.nrOfNotifications = 0;
    } else if (isAllRead === null) {
      this.getNotificationsCount();
    }  else if (this.nrOfNotifications > 0) {
      this.nrOfNotifications--;
    }
  }

  private updateMessagesUnReadCount(isAllRead: boolean) {
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
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => this.text = this.utilsService.getTranslatedText(translations),
      error => this.errorService.handleError(error)
    );
  }

  private setInterfaceLanguages(languages: Language[]) {
    this.intLans = languages.filter(language => language.interface);
    this.setInterfaceLan();
  }

  private getDependables() {
    const options = {
      lan: this.userService.user.main.lan,
      component: 'MainMenuComponent',
      getTranslations: true,
      getLanguages: true
    };
    this.utilsService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.text = this.utilsService.getTranslatedText(dependables.translations);
        this.setInterfaceLanguages(dependables.languages);
        this.isReady = true;
      },
      error => this.errorService.handleError(error)
    );
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'MainMenuComponent'
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
