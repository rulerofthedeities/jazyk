import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Http, Headers} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {User} from '../models/user.model';
import {tokenNotExpired} from 'angular2-jwt';
import {JwtHelper} from 'angular2-jwt';

interface UserStorage {
  token: string;
  userId: string;
  userName: string;
}

@Injectable()
export class AuthService {
  private jwtHelper: JwtHelper = new JwtHelper();

  constructor (
    private http: Http,
    private router: Router
  ) {}

  signup(user: User) {
    const body = JSON.stringify(user);
    const headers = new Headers({'Content-Type': 'application/json'});
    return this.http
    .post('/api/user/signup', body, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error.json()));
  }

  signin(user: User) {
    const body = JSON.stringify(user);
    const headers = new Headers({'Content-Type': 'application/json'});
    return this.http
    .post('/api/user/signin', body, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error.json()));
  }

  signedIn(data: any) {
    console.log('Signed in', data);
    const decoded = this.jwtHelper.decodeToken(data.token);
    const userStorage: UserStorage = {
      token: data.token,
      userId: decoded.user._id,
      userName: decoded.user.userName
    };
    this.storeUserData(userStorage);
    this.router.navigateByUrl('/learn');
  }

  isLoggedIn() {
    return !!tokenNotExpired('km-jazyk.token');
  }

  keepTokenFresh() {
    const token = this.getToken(),
          decoded = this.jwtHelper.decodeToken(token),
          initialSecs = decoded.exp - decoded.iat,
          currentSecs = decoded.exp - Math.floor(Date.now() / 1000);

    console.log('Secs since token created', initialSecs - currentSecs);
    if (initialSecs - currentSecs >= 3600) {
      // renew token if it is older than an hour
      this.refreshToken().subscribe(
        newToken => {
          console.log('received new token');
          localStorage.setItem('km-cznl.token', newToken);
        }
      );
    }
  }

  private refreshToken() {
    const token = this.getToken(),
          headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    return this.http
    .patch('/api/user/refresh', {}, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  private getToken(): string {
    return localStorage.getItem('km-cznl.token');
  }

  private storeUserData(data: UserStorage) {
    localStorage.setItem('km-jazyk.token', data.token);
    localStorage.setItem('km-jazyk.userId', data.userId);
    localStorage.setItem('km-jazyk.userName', data.userName);
  }

  private clearStorage() {
    localStorage.removeItem('km-jazyk.token');
    localStorage.removeItem('km-jazyk.userId');
    localStorage.removeItem('km-jazyk.userName');
  }
}
