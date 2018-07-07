import {HttpInterceptor, HttpRequest, HttpHandler} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {AuthService} from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    let newHeaders = req.headers.set('Content-Type', 'application/json');
    const authToken = this.authService.getToken();
    if (authToken && this.authService.isLoggedIn()) {
      newHeaders = newHeaders.set('Authorization', 'Bearer ' + authToken);
    }
    const newRequest = req.clone({
      headers: newHeaders
    });
    return next.handle(newRequest);
  }
}
