import {Injectable, EventEmitter} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {config} from '../app.config';
import {User, LearnSettings, MainSettings, JazykConfig, CompactProfile,
        Profile, Message, PublicProfile, Notification, Network} from '../models/user.model';
import {Language, Course, UserAccess, AccessLevel} from '../models/course.model';
import {ExerciseData} from '../models/exercise.model';
import {CourseScore} from '../models/score.model';
import {AuthService} from './auth.service';
import {Subscription} from 'rxjs/Subscription';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/takeWhile';
import {retry, delay, map} from 'rxjs/operators';

interface DemoData {
  courseId: string;
  lessonId: string;
  lan: string;
  study?: ExerciseData[];
  practise?: ExerciseData[];
}

@Injectable()
export class UserService {
  private _user: User;
  private demoData: DemoData;
  private subscription: Subscription;
  languageChanged = new EventEmitter<string>();
  backgroundChanged = new EventEmitter<boolean>();
  notificationRead = new EventEmitter<boolean>();
  messageRead = new EventEmitter<boolean>();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // USER DATA

  getUserData(): Observable<User> {
    if (this._user) {
      return Observable.of(this._user);
    } else {
      if (this.authService.isLoggedIn()) {
        const headers = this.getTokenHeaders();
        return this.http
        .get<User>('/api/user', {headers})
        .do(data => {
          this._user = data;
          if (!data) {
            // user not found, get default user data
            return this.getDefaultUserData(null);
          }
        });
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
      learnLan = languages.find(lan => lan.code === userLan);
    }
    if (!learnLan) {
      // Get default language
      learnLan = languages[0];
    }
    return learnLan;
  }

  getDefaultUserData(queryLan: string) {
    const interfaceLan = this.getUserLan(queryLan),
          user: User = this.getAnonymousUser(interfaceLan);
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
        background: true,
        gender: ''
      },
      jazyk: this.getDefaultSettings(userLan, true)
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

  // DEMO DATA

  storeDemoData(data: ExerciseData[], step: string, courseId: string, lessonId: string) {
    if (!this.demoData || this.demoData.courseId !== courseId || this.demoData.lessonId !== lessonId) {
      const lan = data[0].exercise.foreign.region;
      this.demoData = {courseId, lessonId, lan};
    }
    if (step === 'study' || step === 'practise') {
      this.demoData[step] = data;
    }
  }

  getDemoData(step: string, courseId: string): ExerciseData[] {
    if (courseId && this.demoData && courseId === this.demoData.courseId) {
      return this.demoData[step];
    } else {
      return null;
    }
  }

  getDemoLessonId(courseId: string): string {
    if (courseId && this.demoData && courseId === this.demoData.courseId) {
      return this.demoData.lessonId;
    } else {
      return null;
    }
  }

  getDemoCourseId(): string {
    if (this.demoData && this.demoData.courseId) {
      if (this.demoData['study'] || this.demoData['practise']) {
        return this.demoData.courseId;
      } else {
        return null;
      }
    }
  }

  saveDemoResults(data: string): Observable<number> {
    if (this.authService.isLoggedIn()) {
      const headers = this.getTokenHeaders();
      return this.http
      .post<number>('/api/user/results/add', data, {headers});
    } else {
      return Observable.of(null);
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
    this.languageChanged.emit(newLan);
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

  continueCourse(course: Course) {
    // Check if it is a logged in user
    if (this.authService.isLoggedIn() && this._user) {
      this.updateUserDb(course.languagePair.to, null);
      this._user.jazyk.learn.lan = course.languagePair.to;
    }
  }

  getDefaultSettings(lan: string, isAnonymous: boolean): JazykConfig {
    return {
      learn: {
        lan: lan,
        countdown: true,
        nrOfWordsStudy: 5,
        nrOfWordsLearn: 5,
        nrOfWordsReview: 10,
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
      },
      dt: {}
    };
  }

  getLearnSettings(): Observable<LearnSettings> {
        console.log('getting learn settings');
    const headers = this.getTokenHeaders();
    return this.http
    .get<LearnSettings>('/api/user/settings/learn', {headers})
    .pipe(retry(3));
  }

  saveLearnSettings(settings: LearnSettings): Observable<boolean> {
    const headers = this.getTokenHeaders();
    return this.http
    .put<boolean>('/api/user/settings/learn', JSON.stringify(settings), {headers});
  }

  saveMainSettings(settings: MainSettings): Observable<boolean> {
    const headers = this.getTokenHeaders();
    return this.http
    .put<boolean>('/api/user/settings/main', JSON.stringify(settings), {headers});
  }

  getProfile(): Observable<Profile> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<Profile>('/api/user/profile', {headers})
    .pipe(retry(3));
  }

  saveProfile(profile: Profile): Observable<boolean> {
    const headers = this.getTokenHeaders();
    return this.http
    .put<boolean>('/api/user/profile', JSON.stringify(profile), {headers});
  }

  getPublicProfile(user: string): Observable<PublicProfile> {
    const headers = this.getTokenHeaders(),
          filteredUser = user.slice(0, 25);
    return this.http
    .get<PublicProfile>('/api/user/profile/' + filteredUser, {headers})
    .pipe(retry(3));
  }

  getPublicProfileById(userId: string): Observable<PublicProfile> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<PublicProfile>('/api/user/profileId/' + userId, {headers})
    .pipe(retry(3));
  }

  saveNotification(notification: Notification): Observable<Notification> {
    const headers = this.getTokenHeaders();
    return this.http
    .put<Notification>('/api/user/notification', JSON.stringify(notification), {headers});
  }

  fetchNotifications(): Observable<Notification[]> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<Notification[]>('/api/user/notifications', {headers})
    .pipe(retry(3));
  }

  fetchNotification(notificationId: string): Observable<Notification> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<Notification>('/api/user/notification/' + notificationId, {headers})
    .pipe(retry(3));
  }

  deleteNotification(notificationId: string): Observable<Notification> {
    const headers = this.getTokenHeaders();
    return this.http
    .delete<Notification>('/api/user/notification/' + notificationId, {headers});
  }

  deleteReadNotifications(): Observable<boolean> {
    const headers = this.getTokenHeaders();
    return this.http
    .delete<boolean>('/api/user/notifications', {headers});
  }

  fetchNotificationsCount(): Observable<number> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<number>('/api/user/notificationscount', {headers})
    .pipe(retry(3));
  }

  setNotificationAsRead(notificationId: string): Observable<boolean> {
    const headers = this.getTokenHeaders();
    return this.http
    .patch<boolean>('/api/user/notificationread', JSON.stringify({notificationId}), {headers});
  }

  setAllNotificationsAsRead(): Observable<boolean> {
    const headers = this.getTokenHeaders();
    return this.http
    .patch<boolean>('/api/user/notificationsread', JSON.stringify({}), {headers});
  }

  getWelcomeNotification(lan: string): Observable<Notification> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<Notification>('/api/user/config/welcome/' + lan, {headers})
    .pipe(retry(3));
  }

  fetchScoreTotal(): Observable<number> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<number>('/api/user/score/total', {headers})
    .pipe(retry(3));
  }

  fetchScoreCourses(): Observable<CourseScore> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<CourseScore>('/api/user/score/courses', {headers})
    .pipe(retry(3));
  }

  followUser(userId: string): Observable<boolean> {
    const headers = this.getTokenHeaders();
    return this.http
    .post<boolean>('/api/user/follow', JSON.stringify({userId}), {headers});
  }

  unFollowUser(userId: string): Observable<boolean> {
    const headers = this.getTokenHeaders();
    return this.http
    .put<boolean>('/api/user/unfollow', JSON.stringify({userId}), {headers});
  }

  getFollowers(userId: string): Observable<Network> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<Network>('/api/user/followers/' + userId, {headers})
    .pipe(retry(3));
  }

  getCompactProfiles(userIds: string[]): Observable<CompactProfile[]> {
    userIds.join(',');
    return this.http
    .get<CompactProfile[]>('/api/user/profiles/' + userIds)
    .pipe(retry(3));
  }

  getCoursesTeaching(userId: string): Observable<Course[]> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<Course[]>('/api/courses/teaching/' + userId, {headers})
    .pipe(retry(3));
  }

  fetchMessages(tpe: string): Observable<Message[]> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<Message[]>('/api/user/messages/' + tpe, {headers})
    .pipe(retry(3));
  }

  fetchMessage(messageId: string): Observable<Message> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<Message>('/api/user/message/' + messageId, {headers})
    .pipe(retry(3));
  }

  fetchMessagesCount(): Observable<number> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<number>('/api/user/messagescount', {headers})
    .pipe(retry(3));
  }

  setMessageAsRead(messageId: string): Observable<boolean> {
    const headers = this.getTokenHeaders();
    return this.http
    .patch<boolean>('/api/user/messageread', JSON.stringify({messageId}), {headers});
  }

  setAllMessagesAsRead(): Observable<boolean> {
    const headers = this.getTokenHeaders();
    return this.http
    .patch<boolean>('/api/user/messagesread', JSON.stringify({}), {headers});
  }

  deleteMessage(messageId: string, tpe: string, action: string): Observable<boolean> {
    const headers = this.getTokenHeaders();
    return this.http
    .patch<boolean>('/api/user/messagedelete', JSON.stringify({action, tpe, messageId}), {headers});
  }

  deleteReadMessages(): Observable<boolean> {
    const headers = this.getTokenHeaders();
    return this.http
    .patch<boolean>('/api/user/messagesdelete', {}, {headers});
  }

  emptyTrash(): Observable<boolean> {
    const headers = this.getTokenHeaders();
    return this.http
    .patch<boolean>('/api/user/emptytrash', {}, {headers});
  }

  saveMessage(message: Message): Observable<Message> {
    const headers = this.getTokenHeaders();
    return this.http
    .put<Message>('/api/user/message', JSON.stringify(message), {headers});
  }

  fetchRecipients(): Observable<CompactProfile[]> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<CompactProfile[]>('/api/user/recipients', {headers})
    .pipe(retry(3));
  }

  updatePassword(oldPw: string, newPw: string): Observable<boolean> {
    const headers = this.getTokenHeaders();
    return this.http
    .patch<boolean>('/api/user/password', JSON.stringify({old: oldPw, new: newPw}), {headers});
  }

  subscribeToCourse(course: Course) {
    // Only subscribe if it is a loggedin user
    if (this.authService.isLoggedIn() && this._user && !course.isDemo) {
      const lan = course.languagePair.to;
      this.updateUserDb(lan, course._id);
      this.updateUserCache(lan);
    }
  }

  subscribeToDemo(courseId: string) {
    if (this.authService.isLoggedIn()) {
      if (courseId && this.demoData && courseId === this.demoData.courseId) {
        if (this.demoData.lan) {
          this.updateUserDb(this.demoData.lan, courseId);
          this.updateUserCache(this.demoData.lan);
        }
      }
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
    const headers = this.getTokenHeaders();
    // Update learning lan
    if (lan && this._user.jazyk.learn.lan !== lan) {
      this.http
      .patch('/api/user/lan', JSON.stringify({lan}), {headers})
      .toPromise(); // not lazy
    }
    // Upsert subscription
    if (courseId) {
      this.http
      .post('/api/user/subscribe', JSON.stringify({courseId}), {headers})
      .toPromise(); // not lazy
    }
  }

  private updateUserCache(lan: string) {
    // Add learn language to cached user data
    this._user.jazyk.learn.lan = lan;
  }

  private getUserLan(queryLan: string): string {
    // User is not logged in, or no lan data
    // First get lan from url parm
    let lan = this.validateLan(queryLan);
    if (!lan) {
      // if not in url parm, check if the lan is set in the browser
      lan = localStorage.getItem('km-jazyk.lan');
      // if not set in browser, get from navigator
      if (!lan) {
        lan = this.validateLan(navigator.language.slice(0, 2));
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

  /*** Common ***/

  private getTokenHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this.authService.getToken();
    headers = headers.append('Content-Type', 'application/json');
    headers = headers.append('Authorization', 'Bearer ' + token);
    return headers;
  }
}
