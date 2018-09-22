import { NgModule, ModuleWithProviders } from '@angular/core';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { ErrorService } from './services/error.service';
import { SharedService } from './services/shared.service';
import { AuthGuard } from './guards/auth.guard';
import { CommonModule } from '@angular/common';
import { CookieModule } from 'ngx-cookie';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

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
        ErrorService,
        {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true}
      ]
    };
  }
}
