import {Injectable} from '@angular/core';
import {Resolve, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {AuthService} from '../services/auth.service';
import {UserService} from '../services/user.service';

@Injectable()
export class UserResolver implements Resolve<any> {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any> {
    if (this.authService.isLoggedIn()) {
      return this.userService.getUserData();
    } else {
      return this.userService.getDefaultUserData(state.root.queryParams['lan']);
    }

  }
}
