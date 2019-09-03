import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { PlatformService } from '../services/platform.service';
import { awsPath, SharedService } from '../services/shared.service';
import { timer } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { environment } from 'environments/environment';

@Component({
  templateUrl: 'base.component.html',
  styleUrls: ['base.component.css']
})

export class BaseComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private isNewVersionAvailable = false;
  month: string;
  exercisesStarted = false;
  showBackground: Boolean;
  imagePath: string;
  announcement: string;
  showAnnouncement = false;
  interfaceLan: string;

  constructor (
    private authService: AuthService,
    private userService: UserService,
    private sharedService: SharedService,
    private platform: PlatformService
  ) {}

  ngOnInit() {
    this.imagePath = awsPath + 'images/bg/';
    this.showBackground = this.userService.user.main.background;
    this.interfaceLan = this.userService.user.main.lan;
    this.setBackgroundMonth();
    this.setUpTokenRefresh();
    this.checkVersion();
    this.observe();
  }

  private setBackgroundMonth() {
    const dt = new Date();
    const y = dt.getFullYear();
    const m = ('0' + (dt.getMonth() + 1)).slice(-2);
    this.month = y + m;
  }

  private setUpTokenRefresh() {
    if (this.platform.isBrowser) {
      // Client only code
      const timerObservable = timer(30000, 3600000); // Start after 30 secs, then check every hour
      timerObservable
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(t => {
        if (this.authService.isLoggedIn()) {
          this.authService.keepTokenFresh();
        }
      });
    }
  }

  private checkVersion() {
    if (this.platform.isBrowser) {
      // Client only code
      const timerObservable = timer(300000, 3600000); // First check after five minutes, then check every hour
      timerObservable
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(t => {
        this.fetchCurrentVersion();
      });
    }
  }

  private fetchCurrentVersion() {
    this.userService
    .fetchAppVersion()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      version => {
        if (version && version.code) {
          this.isNewVersionAvailable = this.compareVersions(environment.version, version.code);
          if (this.isNewVersionAvailable) {
            this.announcement = 'NewVersionAvailable';
            this.showAnnouncement = true;
          }
        }
      }
    );
  }

  private compareVersions(currentVersion: string, latestVersion: string) {
    let isNewVersionAvailable = false;
    if (currentVersion !== latestVersion) {
      const currentArr = currentVersion.split('.'),
            latestArr = latestVersion.split('.');
      let current: string,
          latest: string;
      for (let i = 0; i < currentArr.length; i++) {
        current = currentArr[i] || '0';
        latest = latestArr[i] || '0';
        if (parseInt(latest, 10) > parseInt(current, 10)) {
          isNewVersionAvailable = true;
        } else if (parseInt(latest, 10) < parseInt(current, 10)) {
          break;
        }
      }
    }
    return isNewVersionAvailable;
  }

  private observe() {
    // Check if exercise started
    this.sharedService
    .exerciseModeChanged
    .pipe(takeWhile( () => this.componentActive))
    .subscribe(
      started => this.exercisesStarted = started
    );
    // Check if announcement should be closed
    this.sharedService
    .announcementModeChanged
    .pipe(takeWhile( () => this.componentActive))
    .subscribe(
      announcement => this.showAnnouncement = announcement
    );
    // Check if background image is toggled
    this.userService
    .backgroundChanged
    .subscribe(
      status => this.showBackground = status
    );
    // Check if user has logged in / out
    this.sharedService
    .justLoggedInOut
    .subscribe(
      (loggedIn) => {
        if (loggedIn) {
          this.showBackground = this.userService.user.main.background;
        } else {
          this.showBackground = true;
        }
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
