import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {config} from '../app.config';
import {User, LearnSettings} from '../models/user.model';
import {Language, Course} from '../models/course.model';
import {AuthService} from './auth.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/of';

@Injectable()
export class UserService {
  private _user: User;

  constructor(
    private http: Http,
    private authService: AuthService
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
    const user: User = this.getAnonymousUser(interfaceLan, '');
    console.log('getting default user data', user, queryLan);
    this._user = user;
    return Observable.of(user);
  }

  clearUser() {
    const userLan = this.user.lan,
          learnLan = this.user.jazyk.learn.lan;
    this._user = this.getAnonymousUser(userLan, learnLan);
  }

  getAnonymousUser(userLan: string, learnLan: string): User {
    const user: User = {
      email: '',
      userName: 'anonymous',
      lan: userLan,
      jazyk: {
        learn: {
          lan: learnLan,
          countdown: true,
          nrOfWords: 5,
          mute: false,
          delay: 2,
          color: true,
          keyboard: false
        }
      }
    };
    return user;
  }

  continueCourse(course: Course) {
    // Check if it is a loggedin user
    if (this.authService.isLoggedIn() && this._user) {
      const data = JSON.stringify({lan: course.languagePair.to});
      this.updateUserDb(data);
      this._user.jazyk.learn.lan = course.languagePair.to;
    }
  }

  saveLearnSettings(settings: LearnSettings) {
    const token = this.authService.getToken(),
          headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    return this.http
    .put('/api/user/settings', JSON.stringify(settings), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  subscribeToCourse(course: Course) {
    // Only subscribe if it is a loggedin user
    if (this.authService.isLoggedIn() && this._user) {
      const data = JSON.stringify({courseId: course._id, lan: course.languagePair.to});
      this.updateUserDb(data);
      this.updateUserCache(course);
    }
  }

  private updateUserDb(data: string) {
    // subscribe + set learn language
    const token = this.authService.getToken(),
            headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    this.http
    .patch('/api/user/subscribe', data, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error))
    .toPromise(); // not lazy
  }

  private updateUserCache(course: Course) {
    // Add subscription + learn language to cached user data
    this._user.jazyk.learn.lan = course.languagePair.to;
    if (this.user.jazyk.courses) {
      const courses = this.user.jazyk.courses.find(courseId => courseId === course._id);
      if (!courses) {
        this._user.jazyk.courses.push(course._id);
      }
      console.log('updated user', this._user);
    }
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
      const interfaceLanguages = this.getInterfaceLanguages();
      const acceptedLanguage = interfaceLanguages.find(language => language._id === lan);
      if (!acceptedLanguage) {
        lan = null;
      }
    }
    return lan;
  }

  private getInterfaceLanguages() {
    const languages: Language[] = [
      {
        _id: 'en',
        name: 'EN',
        active: true
      },
      {
        _id: 'fr',
        name: 'FR',
        active: true
      },
      {
        _id: 'nl',
        name: 'NL',
        active: true
      }
    ];

    return languages;
  }

  get user() {
    return this._user;
  }

  set user(user: User) {
    if (user) {
      this._user = user;
    }
  }
}
