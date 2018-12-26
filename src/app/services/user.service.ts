import { Injectable, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { config } from '../app.config';
import { User, AppSettings, JazykConfig, CompactProfile,
         Profile, Message, PublicProfile, Notification, Network, MailData, MailOptIn, MailDataOptions } from '../models/user.model';
import { Language, UserAccess, AccessLevel } from '../models/main.model';
import { BookScore, LeaderUser } from '../models/score.model';
import { Trophy, UserBook } from '../models/book.model';
import { AuthService } from './auth.service';
import { Observable, Subscription, of, Subject } from 'rxjs';
import { retry, tap, takeWhile } from 'rxjs/operators';

@Injectable()
export class UserService {
  private _user: User;
  private subscription: Subscription;
  // strong pw: min 8 characters, 1 special char, 1 digit, one lowercase letter, one uppercase char
  private strongRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})');
  // medium pw: min 6 characters, 1 lowercase and digit OR 1 uppercase and digit
  private mediumRegex = new RegExp('^(((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})');
  interfaceLanguageChanged = new Subject<string>();
  backgroundChanged = new EventEmitter<boolean>();
  notificationRead = new EventEmitter<boolean>();
  messageRead = new EventEmitter<boolean>();

  constructor(
    private http: HttpClient,
    private router: Router,
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
      isAdmin: false,
      mailVerification: {isVerified: false},
      mailOptIn: {info: false}
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

  // PASSWORDS

  getPasswordStrength(password: string) {
    if (this.strongRegex.test(password)) {
      return 'strong';
    } else if (this.mediumRegex.test(password)) {
      return 'medium';
    } else {
      return 'weak';
    }
  }

  getPasswordColor(pw: string): string {
    let color = 'red';
    const strength = this.getPasswordStrength(pw);
    switch (strength) {
      case 'strong': color = 'green'; break;
      case 'medium': color = 'orange'; break;
    }
    return color;
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

  saveMailSettings(settings: MailOptIn): Observable<boolean> {
    return this.http
    .put<boolean>('/api/user/mailsettings', settings);
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

  goToPublicProfile() {
    const user = this.user.userName;
    this.router.navigate(['/u/' + user]);
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

  getWelcomeMessage(lan: string): Observable<{message: string}> {
    return this.http
    .get<{message: string}>('/api/user/config/welcome/' + lan)
    .pipe(retry(3));
  }

  fetchScoreTotal(userId: string = null): Observable<number> {
    const suffix = userId || '';
    return this.http
    .get<number>('/api/user/score/total/' + suffix)
    .pipe(retry(3));
  }

  fetchScoreBooks(bookType: string):  Observable<BookScore> {
    return this.http
    .get<BookScore>('/api/user/score/books/' + bookType)
    .pipe(retry(3));
  }

  // Leaderboard Users
  fetchUsers(userIds: string[]): Observable<LeaderUser[]> {
    return this.http
    .post<LeaderUser[]>('/api/users/byid', {userIds})
    .pipe(retry(3));
  }

  fetchTrophies(userId: string = null): Observable<Trophy[]> {
    const suffix = userId || '';
    return this.http
    .get<Trophy[]>('/api/book/trophies/user/' + suffix)
    .pipe(retry(3));
  }

  fetchFinishedBooks(): Observable<UserBook[]> {
    return this.http
    .get<UserBook[]>('/api/user/finishedbooks/')
    .pipe(retry(3));
  }

  followUser(userId: string): Observable<boolean> {
    return this.http
    .post<boolean>('/api/user/follow', {userId});
  }

  unFollowUser(userId: string): Observable<boolean> {
    return this.http
    .put<boolean>('/api/user/unfollow', {userId});
  }

  fetchFollowers(userId: string): Observable<Network> {
    return this.http
    .get<Network>('/api/user/followers/' + userId)
    .pipe(retry(3));
  }

  getCompactProfiles(userIds: string[]): Observable<CompactProfile[]> {
    return this.http
    .post<CompactProfile[]>('/api/user/profiles', {userIds})
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

  fetchWelcomeMessage(user: User) {
    let messageLoaded = false;
    this.getWelcomeMessage(user.main.lan)
    .pipe(takeWhile(() => !messageLoaded))
    .subscribe(
      welcome => {
        messageLoaded = true;
        if (welcome && welcome.message) {
          this.createMessage(welcome.message);
        }
      }
    );
  }

  /** MAILS */

  sendMailVerification(mailData: MailData): Observable<boolean> {
    return this.http
    .post<boolean>('/api/user/sendverificationmail', {mailData});
  }

  checkVerificationId(verId: string): Observable<boolean> {
    return this.http
    .post<boolean>('/api/user/checkverificationId', {verId});
  }

  checkResetId(resetId: string, email: string): Observable<string> {
    return this.http
    .post<string>('/api/user/checkresetId', {resetId, email});
  }

  resetPw(pw: string, email: string, resetId: string): Observable<string> {
    return this.http
    .post<string>('/api/user/resetpw', {pw, resetId, email});
  }

  sendMailForgotPassword(mailData: MailData, email): Observable<boolean> {
    return this.http
    .post<boolean>('/api/user/sendforgotpwmail', {mailData, email});
  }

  getMailData(text: Object, tpe: string, options: MailDataOptions): MailData {
    if (tpe === 'verification') {
      let hello = text['DearUser'];
      if (hello) {
        hello = hello.replace('%s', options.userName);
      }
      const welcome = options.isNewUser ? text['WelcomeToJazyk'] : '',
            welcomeLowerCase = welcome.charAt(0).toLowerCase() + welcome.substr(1),
            welcomeSubject = welcome ? welcome + '! ' : '',
            welcomeText = welcomeLowerCase ? welcomeLowerCase + '. ' : '';
      return {
        subject: welcomeSubject + text['ConfirmYourEmail'],
        bodyText: ' ' + hello + '\n' + welcomeText + text['ConfirmMailText1'] + ' ' + text['ConfirmMailText2'],
        bodyHtml: `
          ${hello}<br><br>${welcomeText}${text['ConfirmMailText1']}<br>
          ${text['ConfirmMailHtml2']} <a href="%s">${text['ConfirmYourEmail']}</a>`
      };
    }
    if (tpe === 'forgotpassword') {
      const forgotpasswordMailText4 = text['ForgotPasswordMailText4'].replace('%d', options.expireHours);
      const subject = text['ForgottenPasswordRequest'],
            bodyText = ' ' + text['ForgotPasswordMailText1'] + ' \n\n' +
              ' ' + text['ForgotPasswordMailText2'] + ' \n\n' +
              ' ' + text['ForgotPasswordMailText3'] + ' \n\n' +
              ' ' + forgotpasswordMailText4 + ' \n\n' +
              ' ' + text['Thanks'] + ',' + ' \nJazyk',
            bodyHtml = text['ForgotPasswordMailText1'] + '<br><br>' +
              text['ForgotPasswordMailText2'] + '<br><br>' +
              text['ForgotPasswordMailText3'] + '<br><br>' +
              forgotpasswordMailText4 + '<br><br>' +
              text['Thanks'] + ',' + '<br>Jazyk',
              linkText = text['link'];
      return {
        subject,
        bodyText,
        bodyHtml,
        linkText
      };
    }
  }

  private createMessage(content: string) {
    let messageCreated = false;
    const newMessage: Message = {
      recipient: {
        id: this.user._id,
        userName: this.user.userName,
        emailHash: this.user.emailHash
      },
      sender: {
        id: '5af559281c30bb3eb80a7ad0',
        userName: 'admin',
        emailHash: '3857587e906eb30baac237dcafa312d4'
      },
      message: content
    };
    this.subscription = this
    .saveMessage(newMessage)
    .pipe(takeWhile(() => !messageCreated))
    .subscribe(
      result => {
        messageCreated = true;
        this.updateUnreadMessagesCount(null);
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
