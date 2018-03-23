import {NgModule, ModuleWithProviders, Optional, SkipSelf} from '@angular/core';
import {UserService} from './services/user.service';
import {AuthService} from './services/auth.service';
import {SharedService} from './services/shared.service';
import {AuthGuard} from './services/auth-guard.service';
import {CommonModule} from '@angular/common';

@NgModule({
  imports: [CommonModule],
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
        AuthGuard
      ]
    };
  }
}
