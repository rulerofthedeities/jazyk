import {Injectable, EventEmitter} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {config} from '../app.config';
import {User, LearnSettings, MainSettings, JazykConfig, Profile, Notification} from '../models/user.model';
import {Language, Course} from '../models/course.model';
import {AuthService} from './auth.service';
import {UtilsService} from './utils.service';
import {Subscription} from 'rxjs/Subscription';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/takeWhile';


@Injectable()
export class UserService {
  private _user: User;
  private subscription: Subscription;
  languageChanged = new EventEmitter<string>();
  backgroundChanged = new EventEmitter<boolean>();
  notificationRead = new EventEmitter<boolean>();

  constructor(
    private http: Http,
    private authService: AuthService,
    private utilsService: UtilsService
  ) {}

  getUserData() {
    console.log('cached user data', this._user);
    if (this._user) {
      return Observable.of(this._user);
    } else {
      if (this.authService.isLoggedIn()) {
        console.log('logged in, get data from server');
        const token = this.authService.getToken(),
              headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Authorization', 'Bearer ' + token);
        return this.http
        .get('/api/user', {headers})
        .map(response => response.json().obj)
        .do(data => {
          this._user = data;
          console.log('new user data from server', this._user);
          if (!data) {
            // user not found, get default user data
            return this.getDefaultUserData(null);
          }
        })
        .catch(error => Observable.throw(error));
      } else {
        return this.getDefaultUserData(null);
      }
    }
  }

  getUserLearnLanguage(languages: Language[]): Language {
    let learnLan: Language;
    if (this._user.jazyk) {
      // Get language currently learning
      const userLan = this._user.jazyk.learn.lan;
      learnLan = languages.find(lan => lan._id === userLan);
    }
    if (!learnLan) {
      // Get default language
      learnLan = languages[0];
    }

    return learnLan;
  }

  getDefaultUserData(queryLan: string) {
    const interfaceLan = this.getUserLan(queryLan);
    const user: User = this.getAnonymousUser(interfaceLan);
    console.log('getting default user data', user, queryLan);
    this._user = user;
    return Observable.of(user);
  }

  clearUser() {
    this._user = this.getAnonymousUser(this.user.main.lan);
  }

  getAnonymousUser(userLan: string): User {
    const user: User = {
      email: '',
      emailHash: '',
      userName: 'anonymous',
      main: {
        lan: userLan,
        background: true
      },
      jazyk: this.getDefaultSettings(userLan)
    };
    return user;
  }

  interfaceLanChanged(newLan: string) {
    this.languageChanged.emit(newLan);
  }

  backgroundImgChanged(status: boolean) {
    this.backgroundChanged.emit(status);
  }

  updateUnreadNotificationsCount(allUnread: boolean) {
    this.notificationRead.emit(allUnread);
  }

  continueCourse(course: Course) {
    // Check if it is a logged in user
    if (this.authService.isLoggedIn() && this._user) {
      this.updateUserDb(course.languagePair.to, null);
      this._user.jazyk.learn.lan = course.languagePair.to;
    }
  }

  getDefaultSettings(lan: string): JazykConfig {
    return {
      learn: {
        lan: lan,
        countdown: true,
        nrOfWordsStudy: 5,
        nrOfWordsLearn: 5,
        nrOfWordsReview: 5,
        mute: false,
        delay: 2,
        color: true,
        keyboard: true
      },
      profile: {
        realName: '',
        timeZone: '',
        location: '',
        bio: '',
        nativeLan: ''
      }
    };
  }

  getLearnSettings() {
    const headers = this.getTokenHeaders();
    return this.http
    .get('/api/user/settings/learn', {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  saveLearnSettings(settings: LearnSettings) {
    const headers = this.getTokenHeaders();
    return this.http
    .put('/api/user/settings/learn', JSON.stringify(settings), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  saveMainSettings(settings: MainSettings) {
    const headers = this.getTokenHeaders();
    return this.http
    .put('/api/user/settings/main', JSON.stringify(settings), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  getProfile() {
    const headers = this.getTokenHeaders();
    return this.http
    .get('/api/user/profile', {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  saveProfile(profile: Profile) {
    const headers = this.getTokenHeaders();
    return this.http
    .put('/api/user/profile', JSON.stringify(profile), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  getPublicProfile(user: string) {
    const headers = this.getTokenHeaders();
    user = user.slice(0, 25);
    console.log('Fetching public profile for user', user);
    return this.http
    .get('/api/user/profile/' + user, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  saveNotification(notification: Notification) {
    const headers = this.getTokenHeaders();
    return this.http
    .put('/api/user/notification', JSON.stringify(notification), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchNotifications() {
    const headers = this.getTokenHeaders();
    return this.http
    .get('/api/user/notifications', {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchNotification(notificationId: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .get('/api/user/notification/' + notificationId, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  deleteNotification(notificationId: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .delete('/api/user/notification/' + notificationId, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  deleteReadNotifications() {
    const headers = this.getTokenHeaders();
    return this.http
    .delete('/api/user/notifications/', {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchNotificationsCount() {
    const headers = this.getTokenHeaders();
    return this.http
    .get('/api/user/notificationsCount', {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  setNotificationAsRead(notificationId: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .patch('/api/user/notificationread', JSON.stringify({notificationId}), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  setAllNotificationsAsRead() {
    const headers = this.getTokenHeaders();
    return this.http
    .patch('/api/user/notificationsread', JSON.stringify({}), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  getWelcomeNotification(lan: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .get('/api/user/config/welcome/' + lan, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  followUser(userId: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .post('/api/user/follow', JSON.stringify({userId}), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  unFollowUser(userId: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .put('/api/user/unfollow', JSON.stringify({userId}), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  getFollowers(userId: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .get('/api/user/followers/' + userId, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  getCompactProfiles(userIds: string[]) {
    userIds.join(',');
    console.log('userIds', userIds);
    return this.http
    .get('/api/user/profiles/' + userIds)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  getCoursesTeaching(userId: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .get('/api/courses/teaching/' + userId, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updatePassword(oldPw: string, newPw: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .patch('/api/user/password', JSON.stringify({old: oldPw, new: newPw}), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  subscribeToCourse(course: Course) {
    // Only subscribe if it is a loggedin user
    if (this.authService.isLoggedIn() && this._user) {
      const lan = course.languagePair.to;
      this.updateUserDb(lan, course._id);
      this.updateUserCache(lan);
    }
  }

  fetchWelcomeNotification(user: User) {
    let notificationLoaded = false;
    this.subscription = this
    .getWelcomeNotification(user.main.lan)
    .takeWhile(() => !notificationLoaded)
    .subscribe(
      notification => {
        notificationLoaded = true;
        if (notification) {
          notification.userId = user._id;
          this.createNotification(notification);
        }
      }
    );
  }

  private createNotification(notification: Notification) {
    let notificationCreated = false;
    this.subscription = this
    .saveNotification(notification)
    .takeWhile(() => !notificationCreated)
    .subscribe(
      result => {
        notificationCreated = true;
        this.updateUnreadNotificationsCount(null);
      }
    );
  }

  private updateUserDb(lan: string, courseId: string) {
    // subscribe + set learn language
    const token = this.authService.getToken(),
            headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    // Update learning lan
    if (lan && this._user.jazyk.learn.lan !== lan) {
      this.http
      .patch('/api/user/lan', JSON.stringify({lan}), {headers})
      .map(response => response.json().obj)
      .catch(error => Observable.throw(error))
      .toPromise(); // not lazy
    }
    // Upsert subscription
    if (courseId) {
      this.http
      .post('/api/user/subscribe', JSON.stringify({courseId}), {headers})
      .map(response => response.json().obj)
      .catch(error => Observable.throw(error))
      .toPromise(); // not lazy
    }
  }

  private updateUserCache(lan: string) {
    // Add learn language to cached user data
    this._user.jazyk.learn.lan = lan;
  }

  private getUserLan(queryLan: string): string {
    // User is not logged in, or no lan data -> get lan from url parm
    let lan = this.validateLan(queryLan);
    // if not in url parm, get from navigator
    if (!lan) {
      lan = this.validateLan(navigator.language.slice(0, 2));
    }
    // if not in navigator, get from config
    lan = lan || config.language;
    return lan;
  }

  private validateLan(lan: string): string {
    if (lan) {
      const interfaceLanguages = this.utilsService.getInterfaceLanguages();
      const acceptedLanguage = interfaceLanguages.find(language => language._id === lan);
      if (!acceptedLanguage) {
        lan = null;
      }
    }
    return lan;
  }

  get user() {
    return this._user;
  }

  set user(user: User) {
    if (user) {
      this._user = user;
    }
  }

  /*** Common ***/

  private getTokenHeaders(): Headers {
    const token = this.authService.getToken(),
          headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    return headers;
  }
}
