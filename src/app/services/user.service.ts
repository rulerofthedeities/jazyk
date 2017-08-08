import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {config} from '../app.config';
import {User} from '../models/user.model';
import {Language} from '../models/course.model';
import {AuthService} from './auth.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
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
        .do(data => this._user = data)
        .catch(error => Observable.throw(error));
      } else {
        return this.getDefaultUserData(null);
      }
    }
  }

  getDefaultUserData(queryLan: string) {
    const interfaceLan = this.getUserLan(queryLan);
    const user: User = {
      email: '',
      password: '',
      userName: 'anonymous',
      lan: interfaceLan
    };
    console.log('getting default user data', user, queryLan);
    this._user = user;
    return Observable.of(user);
  }

  private getUserLan(queryLan: string): string {
    // User is not logged in, or no lan data -> get lan from url parm
    let lan = this.validateLan(queryLan);
    console.log('1. querylan', lan);
    // if not in url parm, get from navigator
    if (!lan) {
      lan = this.validateLan(navigator.language.slice(0, 2));
    }
    console.log('2. navlan', lan);
    // if not in navigator, get from config
    lan = lan || config.language;
    console.log('3. configlan', lan);
    console.log('interface lan', lan);
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
