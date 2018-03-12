import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {tokenNotExpired} from 'angular2-jwt';
import {JwtHelper} from 'angular2-jwt';
import {SharedService} from '../services/shared.service';
import {User} from '../models/user.model';
import {retry} from 'rxjs/operators';

interface UserStorage {
  token: string;
  userId: string;
  userName: string;
}

interface SignedInData {
  message: string;
  token: string;
  user: User;
}

interface Token {
  token: string;
}

@Injectable()
export class AuthService {
  private jwtHelper: JwtHelper = new JwtHelper();

  constructor (
    private http: HttpClient,
    private router: Router,
    private sharedService: SharedService
  ) {}

  signup(user: User): Observable<User>  {
    const body = JSON.stringify(user),
          headers = this.getHeaders();
    return this.http
    .post<User>('/api/user/signup', body, {headers});
  }

  signin(user: User): Observable<SignedInData> {
    const body = JSON.stringify(user),
          headers = this.getHeaders();
    return this.http
    .post<SignedInData>('/api/user/signin', body, {headers});
  }

  signedIn(data: SignedInData) {
    const decoded = this.jwtHelper.decodeToken(data.token),
          userStorage: UserStorage = {
            token: data.token,
            userId: decoded.user._id,
            userName: decoded.user.userName
          };
    this.storeUserData(userStorage);
    this.router.navigateByUrl('/home');
  }

  logout(event: MouseEvent) {
    event.preventDefault();
    this.clearStorage();
    this.router.navigate(['/']);
    this.sharedService.userJustLoggedOut();
  }

  isLoggedIn(): boolean {
    return !!tokenNotExpired('km-jazyk.token');
  }

  keepTokenFresh() {
    const token = this.getToken();
    if (token) {
      const decoded = this.jwtHelper.decodeToken(token),
            initialSecs = decoded.exp - decoded.iat,
            currentSecs = decoded.exp - Math.floor(Date.now() / 1000);

      if (initialSecs - currentSecs >= 3600) {
        // renew token if it is older than an hour
        this.refreshToken().subscribe(
          newToken => {
            console.log('refreshed token');
            localStorage.setItem('km-jazyk.token', newToken.token);
          }
        );
      }
    }
  }

  getToken(): string {
    return localStorage.getItem('km-jazyk.token');
  }

  private refreshToken(): Observable<Token> {
    const headers = this.getHeaders(true);
    return this.http
    .get<Token>('/api/user/refresh', {headers})
    .pipe(retry(3));
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

  private getHeaders(addToken = false): HttpHeaders {
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    if (addToken) {
      headers = headers.append('Authorization', 'Bearer ' + this.getToken());
    }
    return headers;
  }
}
