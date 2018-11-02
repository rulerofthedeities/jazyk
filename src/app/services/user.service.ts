import { Injectable, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { config } from '../app.config';
import { User, AppSettings, JazykConfig, CompactProfile,
         Profile, Message, PublicProfile, Notification, Network } from '../models/user.model';
import { Language, UserAccess, AccessLevel } from '../models/main.model';
import { BookScore } from '../models/score.model';
import { Trophy, UserBook } from '../models/book.model';
import { AuthService } from './auth.service';
import { Observable, Subscription, of, Subject } from 'rxjs';
import { retry, tap, takeWhile } from 'rxjs/operators';

@Injectable()
export class UserService {
  private _user: User;
  private subscription: Subscription;
  interfaceLanguageChanged = new Subject<string>();
  backgroundChanged = new EventEmitter<boolean>();
  notificationRead = new EventEmitter<boolean>();
  messageRead = new EventEmitter<boolean>();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // APP VERSION
  fetchAppVersion(): Observable<{code: string}> {
    return this.http
    .get<{code: string}>('/api/version');
  }

  // USER DATA

  getUserData(): Observable<User> {
    if (this._user) {
      return of(this._user);
    } else {
      if (this.authService.isLoggedIn()) {
        // const headers = this.getTokenHeaders();
        return this.http
        .get<User>('/api/user')
        .pipe(tap(data => {
          this._user = data;
          if (!data) {
            // user not found, get default user data
            return this.getDefaultUserData(null);
          }
        }));
      } else {
        return this.getDefaultUserData(null);
      }
    }
  }

  getUserReadLanguage(languages: Language[]): Language {
    let learnLan: Language;
    if (this._user.jazyk) {
      // Get language currently learning
      const userLan = this._user.jazyk.read.lan;
      learnLan = languages.find(lan => lan.code === userLan);
    }
    if (!learnLan && languages.length) {
      // Get default language
      learnLan = languages[0];
    }
    return learnLan;
  }

  getUserLanguage(languages: Language[]): Language {
    const userLanCode = this._user.main.myLan || this.user.main.lan;
    let userLan = languages.find(lan => lan.code === userLanCode);
    if (!userLan && languages.length) {
      userLan = languages[0];
    }
    return userLan;
  }

  getDefaultUserData(queryLan: string) {
    const interfaceLan = this.getUserLan(queryLan),
          user: User = this.getAnonymousUser(interfaceLan);
    this._user = user;
    return of(user);
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
        lan: userLan, // interface language
        myLan: userLan,
        background: true,
        gender: '',
      },
      jazyk: this.getDefaultSettings(userLan, true),
      isAdmin: false
    };
    return user;
  }

  get user() {
    return this._user;
  }

  set user(user: User) {
    if (user) {
      this._user = user;
    }
  }

  // ACCESS LEVELS

  hasAccessLevel(access: UserAccess[], level: AccessLevel): boolean {
    const userId = this.user._id,
          userAccess = access.find(accessItem => accessItem.userId === userId);
    return userAccess && userAccess.level >= level;
  }

  getAccessLevel(access: UserAccess[]): number {
    let level = 0;
    const userId = this.user._id,
          userAccess = access.find(accessItem => accessItem.userId === userId);
    if (userAccess) {
      level = userAccess.level;
    }
    return level;
  }

  // EVENTS

  interfaceLanChanged(newLan: string) {
    localStorage.setItem('km-jazyk.lan', newLan); // Set current logged in lan also as default lan for when logged out
    this.interfaceLanguageChanged.next(newLan);
  }

  backgroundImgChanged(status: boolean) {
    this.backgroundChanged.emit(status);
  }

  updateUnreadNotificationsCount(allUnread: boolean) {
    this.notificationRead.emit(allUnread);
  }

  updateUnreadMessagesCount(allUnread: boolean) {
    this.messageRead.emit(allUnread);
  }

  getDefaultSettings(lan: string, isAnonymous: boolean): JazykConfig {
    return {
      read: {
        lan: lan,
        countdown: true,
        delay: 3
      },
      profile: {
        realName: '',
        timeZone: '',
        location: '',
        bio: '',
        nativeLan: ''
      },
      dt: {}
    };
  }

  saveSettings(settings: AppSettings): Observable<boolean> {
    return this.http
    .put<boolean>('/api/user/settings', settings);
  }

  getProfile(): Observable<Profile> {
    return this.http
    .get<Profile>('/api/user/profile')
    .pipe(retry(3));
  }

  saveProfile(profile: Profile): Observable<boolean> {
    return this.http
    .put<boolean>('/api/user/profile', JSON.stringify(profile));
  }

  getPublicProfile(user: string): Observable<PublicProfile> {
    const filteredUser = user.slice(0, 25);
    return this.http
    .get<PublicProfile>('/api/user/profile/' + filteredUser)
    .pipe(retry(3));
  }

  getPublicProfileById(userId: string): Observable<PublicProfile> {
    return this.http
    .get<PublicProfile>('/api/user/profileId/' + userId)
    .pipe(retry(3));
  }

  saveNotification(notification: Notification): Observable<Notification> {
    return this.http
    .put<Notification>('/api/user/notification', JSON.stringify(notification));
  }

  fetchNotifications(): Observable<Notification[]> {
    return this.http
    .get<Notification[]>('/api/user/notifications')
    .pipe(retry(3));
  }

  fetchNotification(notificationId: string): Observable<Notification> {
    return this.http
    .get<Notification>('/api/user/notification/' + notificationId)
    .pipe(retry(3));
  }

  deleteNotification(notificationId: string): Observable<Notification> {
    return this.http
    .delete<Notification>('/api/user/notification/' + notificationId);
  }

  deleteReadNotifications(): Observable<boolean> {
    return this.http
    .delete<boolean>('/api/user/notifications');
  }

  fetchNotificationsCount(): Observable<number> {
    return this.http
    .get<number>('/api/user/notificationscount')
    .pipe(retry(3));
  }

  setNotificationAsRead(notificationId: string): Observable<boolean> {
    return this.http
    .patch<boolean>('/api/user/notificationread', JSON.stringify({notificationId}));
  }

  setAllNotificationsAsRead(): Observable<boolean> {
    return this.http
    .patch<boolean>('/api/user/notificationsread', JSON.stringify({}));
  }

  getWelcomeNotification(lan: string): Observable<Notification> {
    return this.http
    .get<Notification>('/api/user/config/welcome/' + lan)
    .pipe(retry(3));
  }

  fetchScoreTotal(): Observable<number> {
    return this.http
    .get<number>('/api/user/score/total')
    .pipe(retry(3));
  }

  fetchScoreBooks(bookType: string):  Observable<BookScore> {
    return this.http
    .get<BookScore>('/api/user/score/books/' + bookType)
    .pipe(retry(3));
  }

  fetchTrophies(): Observable<Trophy[]> {
    return this.http
    .get<Trophy[]>('/api/book/trophies/user')
    .pipe(retry(3));
  }

  fetchFinishedBooks(): Observable<UserBook[]> {
    return this.http
    .get<UserBook[]>('/api/user/finishedbooks/')
    .pipe(retry(3));
  }

  followUser(userId: string): Observable<boolean> {
    return this.http
    .post<boolean>('/api/user/follow', JSON.stringify({userId}));
  }

  unFollowUser(userId: string): Observable<boolean> {
    return this.http
    .put<boolean>('/api/user/unfollow', JSON.stringify({userId}));
  }

  getFollowers(userId: string): Observable<Network> {
    return this.http
    .get<Network>('/api/user/followers/' + userId)
    .pipe(retry(3));
  }

  getCompactProfiles(userIds: string[]): Observable<CompactProfile[]> {
    userIds.join(',');
    return this.http
    .get<CompactProfile[]>('/api/user/profiles/' + userIds)
    .pipe(retry(3));
  }

  fetchMessages(tpe: string): Observable<Message[]> {
    return this.http
    .get<Message[]>('/api/user/messages/' + tpe)
    .pipe(retry(3));
  }

  fetchMessage(messageId: string): Observable<Message> {
    return this.http
    .get<Message>('/api/user/message/' + messageId)
    .pipe(retry(3));
  }

  fetchMessagesCount(): Observable<number> {
    return this.http
    .get<number>('/api/user/messagescount')
    .pipe(retry(3));
  }

  setMessageAsRead(messageId: string): Observable<boolean> {
    return this.http
    .patch<boolean>('/api/user/messageread', JSON.stringify({messageId}));
  }

  setAllMessagesAsRead(): Observable<boolean> {
    return this.http
    .patch<boolean>('/api/user/messagesread', JSON.stringify({}));
  }

  deleteMessage(messageId: string, tpe: string, action: string): Observable<boolean> {
    return this.http
    .patch<boolean>('/api/user/messagedelete', JSON.stringify({action, tpe, messageId}));
  }

  deleteReadMessages(): Observable<boolean> {
    return this.http
    .patch<boolean>('/api/user/messagesdelete', {});
  }

  emptyTrash(): Observable<boolean> {
    return this.http
    .patch<boolean>('/api/user/emptytrash', {});
  }

  saveMessage(message: Message): Observable<Message> {
    return this.http
    .put<Message>('/api/user/message', JSON.stringify(message));
  }

  fetchRecipients(): Observable<CompactProfile[]> {
    return this.http
    .get<CompactProfile[]>('/api/user/recipients')
    .pipe(retry(3));
  }

  updatePassword(oldPw: string, newPw: string): Observable<boolean> {
    return this.http
    .patch<boolean>('/api/user/password', JSON.stringify({old: oldPw, new: newPw}));
  }

  fetchWelcomeNotification(user: User) {
    let notificationLoaded = false;
    this.subscription = this
    .getWelcomeNotification(user.main.lan)
    .pipe(takeWhile(() => !notificationLoaded))
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
    .pipe(takeWhile(() => !notificationCreated))
    .subscribe(
      result => {
        notificationCreated = true;
        this.updateUnreadNotificationsCount(null);
      }
    );
  }

  setLanCode(lanCode: string) {
    // set read language
    if (lanCode && this._user.jazyk.read.lan !== lanCode) {
      this.http
      .patch('/api/user/lan/read', JSON.stringify({lanCode}))
      .subscribe(lan => {
        this.user.jazyk.read.lan = lanCode;
      });
    }
  }

  setUserLanCode(lanCode: string) {
    // set user language (my language)
    if (lanCode && this._user.main.myLan !== lanCode) {
      this.http
      .patch('/api/user/lan/user', JSON.stringify({lanCode}))
      .subscribe(lan => {
        this.user.main.myLan = lanCode;
      });
    }
  }

  private getUserLan(queryLan: string): string {
    // User is not logged in, or no lan data
    // First get lan from url parm
    let lan = this.validateLan(queryLan);
    if (!lan) {
      // if not in url parm, check if the lan is set in the browser
      if (isPlatformBrowser(this.platformId)) {
        // Client only code.
        lan = localStorage.getItem('km-jazyk.lan');
      // if not set in browser, get from navigator
        if (!lan) {
          lan = this.validateLan(navigator.language.slice(0, 2));
        }
      }
      // if not in navigator, get from config
      lan = lan || config.language;
    }
    return lan;
  }

  private validateLan(lan: string): string {
    if (lan) {
      const interfaceLanguages = this.getInterfaceLanguages();
      const acceptedLanguage = interfaceLanguages.find(language => language === lan);
      if (!acceptedLanguage) {
        lan = null;
      }
    }
    return lan;
  }

  private getInterfaceLanguages() {
    return ['en', 'fr', 'nl'];
  }
}
