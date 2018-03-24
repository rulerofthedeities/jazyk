import {Injectable} from '@angular/core';
import {CanActivate} from '@angular/router';
import {AuthService} from './auth.service';
import {Router, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.authService.isLoggedIn()) {
      return true;
    } else {
      this.router.navigate(['/auth/signin'], {queryParams: { returnUrl: state.url}});
      return false;
    }
  }
}
