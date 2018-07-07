import {NgModule, ModuleWithProviders, Optional, SkipSelf} from '@angular/core';
import {UserService} from './services/user.service';
import {AuthService} from './services/auth.service';
import {SharedService} from './services/shared.service';
import {AuthGuard} from './services/auth-guard.service';
import {AuthInterceptor} from './interceptors/auth.interceptor';
import {CommonModule} from '@angular/common';
import {CookieModule} from 'ngx-cookie';
import {HTTP_INTERCEPTORS} from '@angular/common/http';

@NgModule({
  imports: [
    CookieModule.forRoot(),
    CommonModule
  ],
  declarations: [],
  exports: [CommonModule]
})
export class CoreModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreModule,
      providers: [
        AuthService,
        UserService,
        SharedService,
        AuthGuard,
        {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true}
      ]
    };
  }
}
