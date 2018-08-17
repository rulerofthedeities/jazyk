import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {CookieService, CookieOptions} from 'ngx-cookie';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {JwtHelperService} from '@auth0/angular-jwt';
import {SharedService} from './shared.service';
import {User} from '../models/user.model';
import {Observable} from 'rxjs';
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
  returnUrl?: string;
}

interface Token {
  token: string;
}

@Injectable()
export class AuthService {
  private jwtHelper: JwtHelperService = new JwtHelperService();

  constructor (
    private http: HttpClient,
    private router: Router,
    private cookie: CookieService,
    private sharedService: SharedService
  ) {}

  signup(user: User): Observable<User>  {
    const body = JSON.stringify(user);
    return this.http
    .post<User>('/api/user/signup', body);
  }

  signin(user: User): Observable<SignedInData> {
    const body = JSON.stringify(user);
    return this.http
    .post<SignedInData>('/api/user/signin', body);
  }

  signedIn(data: SignedInData, reroute = true) {
    const decoded = this.jwtHelper.decodeToken(data.token),
          userStorage: UserStorage = {
            token: data.token,
            userId: decoded.user._id,
            userName: decoded.user.userName
          };
    this.storeUserData(userStorage);
    this.sharedService.userJustLoggedIn();
    if (reroute) {
      const returnUrl = data.returnUrl || '/home';
      this.router.navigateByUrl(returnUrl);
    }
  }

  logout(event: MouseEvent) {
    this.clearStorage();
    this.router.navigate(['/']);
    this.sharedService.userJustLoggedOut();
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (token) {
      return !this.jwtHelper.isTokenExpired(token);
    } else {
      return false;
    }
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
            this.sharedService.log('Token', 'refreshing token');
            this.cookie.put('km-jazyk.token', newToken.token, this.getCookieOptions());
          }
        );
      }
    }
  }

  getToken(): string {
    return this.cookie.get('km-jazyk.token');
  }

  private refreshToken(): Observable<Token> {
    return this.http
    .get<Token>('/api/user/refresh')
    .pipe(retry(3));
  }

  private storeUserData(data: UserStorage) {
    this.cookie.put('km-jazyk.token', data.token, this.getCookieOptions());
  }

  private clearStorage() {
    this.cookie.removeAll();
  }

  private getCookieOptions(): CookieOptions {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    const cookieOptions: CookieOptions = {
      secure: true,
      httpOnly: true,
      expires: expirationDate
    };
    return cookieOptions;
  }
}
