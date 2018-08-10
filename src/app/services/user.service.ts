import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { config } from '../app.config';
import { User, LearnSettings, MainSettings, JazykConfig, CompactProfile,
         Profile, Message, PublicProfile, Notification, Network } from '../models/user.model';
import { Language, Course, UserAccess, AccessLevel, UserCourse } from '../models/course.model';
import { ExerciseData } from '../models/exercise.model';
import { CourseScore } from '../models/score.model';
import { UserBook } from '../models/book.model';
import { AuthService } from './auth.service';
import { Observable, Subscription, of } from 'rxjs';
import { retry, delay, map, tap, takeWhile } from 'rxjs/operators';

interface DemoData {
  courseId: string;
  lessonId: string;
  lan: string;
  study?: ExerciseData[];
  practise?: ExerciseData[];
}

interface CourseData {
  isDemo: boolean;
  subscribed: Course[];
  data: UserCourse[];
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
      const lan = data && data[0] ? data[0].exercise.foreign.region : '';
      this.demoData = {courseId, lessonId, lan};
    }
    if (step === 'intro' || step === 'dialogue' || step === 'study' || step === 'practise') {
      this.demoData[step] = data;
    }
  }

  clearDemoData() {
    this.demoData = {courseId: null, lessonId: null, lan: ''};
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
      return this.http
      .post<number>('/api/user/results/add', data);
    } else {
      return of(null);
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
        nrOfWordsStudyRepeat: 10,
        nrOfWordsLearnRepeat: 10,
        mute: false,
        delay: 3,
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
    return this.http
    .get<LearnSettings>('/api/user/settings/learn')
    .pipe(retry(3));
  }

  saveLearnSettings(settings: LearnSettings): Observable<boolean> {
    return this.http
    .put<boolean>('/api/user/settings/learn', JSON.stringify(settings));
  }

  saveMainSettings(settings: MainSettings): Observable<boolean> {
    return this.http
    .put<boolean>('/api/user/settings/main', JSON.stringify(settings));
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

  fetchScoreCourses(): Observable<CourseScore> {
    return this.http
    .get<CourseScore>('/api/user/score/courses')
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

  getCoursesTeaching(userId: string): Observable<Course[]> {
    return this.http
    .get<Course[]>('/api/courses/teaching/' + userId)
    .pipe(retry(3));
  }

  getCoursesFollowing(): Observable<CourseData> {
    return this.http
    .get<CourseData>('/api/user/courses/learn')
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

  subscribeToCourse(course: Course) {
    // Only subscribe if it is a loggedin user
    if (this.authService.isLoggedIn() && this._user) {
      const lan = course.languagePair.to;
      this.updateUserDb(lan, course._id);
      this.updateUserCache(lan);
    }
  }

  subscribeToBook(bookId: string): Observable<UserBook> {
    return this.http
    .post<UserBook>('/api/user/subscribe/book', JSON.stringify({bookId, lanCode: this._user.main.lan}));
  }

  unSubscribeFromBook(bookId: string): Observable<UserBook> {
    return this.http
    .post<UserBook>('/api/user/unsubscribe/book', JSON.stringify({bookId, lanCode: this._user.main.lan}));
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
    // set learn language
    if (lanCode && this._user.jazyk.learn.lan !== lanCode) {
      this.http
      .patch('/api/user/lan', JSON.stringify({lanCode}))
      .toPromise(); // not lazy
    }
  }

  private updateUserDb(lan: string, courseId: string, bookId: string = null) {
    // subscribe + set learn language
    // Update learning lan
    if (lan && this._user.jazyk.learn.lan !== lan) {
      this.http
      .patch('/api/user/lan', JSON.stringify({lan}))
      .toPromise(); // not lazy
    }
    // Upsert course subscription
    if (courseId) {
      this.http
      .post('/api/user/subscribe/course', JSON.stringify({courseId}))
      .toPromise(); // not lazy
    }
    // Upsert book subscription
    if (bookId) {
      this.http
      .post('/api/user/subscribe/book', JSON.stringify({bookId}))
      .toPromise(); // not lazy
    }
  }

  private updateUserCache(lan: string) {
    // Add learn language to cached user data
    this._user.jazyk.learn.lan = lan;
  }

  updateUserSettings(settings: LearnSettings) {
    this._user.jazyk.learn = settings;
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
}
