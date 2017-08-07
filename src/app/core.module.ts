import {NgModule, ModuleWithProviders, Optional, SkipSelf} from '@angular/core';
import {UserService} from './services/user.service';
import {AuthService} from './services/auth.service';
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
        UserService
      ]
    };
  }
}
