import {NgModule, ModuleWithProviders} from '@angular/core';
import {HttpModule} from '@angular/http';
import {CommonModule} from '@angular/common';
import {UtilsService} from './services/utils.service';
import {ErrorService} from './services/error.service';

import {ErrorMessageComponent} from './components/msg/error-message.component';
import {ErrorMessageUserComponent} from './components/msg/error-message-user.component';
import {InfoMessageComponent} from './components/msg/info-message.component';
import {LanguageSelectorComponent} from './components/fields/language-selector.component';

@NgModule({
  imports: [
    CommonModule,
    HttpModule
  ],
  declarations: [
    ErrorMessageComponent,
    InfoMessageComponent,
    ErrorMessageUserComponent,
    LanguageSelectorComponent
  ],
  providers: [
    UtilsService,
    ErrorService
  ],
  exports: [
    ErrorMessageComponent,
    InfoMessageComponent,
    ErrorMessageUserComponent,
    LanguageSelectorComponent,
    CommonModule,
    HttpModule
  ]
})
export class SharedModule {static forRoot(): ModuleWithProviders {
  return {
      ngModule: SharedModule,
      providers: [
        UtilsService,
        ErrorService
      ]
    };
  }
}
