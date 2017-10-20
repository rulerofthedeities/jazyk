import {NgModule, ModuleWithProviders} from '@angular/core';
import {HttpModule} from '@angular/http';
import {CommonModule} from '@angular/common';
import {MarkdownModule} from 'angular2-markdown';
import {UtilsService} from './services/utils.service';
import {ErrorService} from './services/error.service';

import {ErrorMessageComponent} from './components/msg/error-message.component';
import {InfoMessageComponent} from './components/msg/info-message.component';
import {LanguageSelectorComponent} from './components/fields/language-selector.component';
import {ModalConfirmComponent} from './components/modals/modal-confirm.component';
import {AudioFileComponent} from './components/fields/audio-file.component';
import {FieldMessagesComponent} from './components/msg/field-messages.component';
import {UserComponent} from './components/user/user.component';
import {UserCourseBarComponent} from './components/user/course-bar.component';
import {GravatarDirective} from './directives/gravatar.directive';

@NgModule({
  imports: [
    CommonModule,
    HttpModule,
    MarkdownModule.forRoot()
  ],
  declarations: [
    ErrorMessageComponent,
    InfoMessageComponent,
    LanguageSelectorComponent,
    ModalConfirmComponent,
    AudioFileComponent,
    FieldMessagesComponent,
    UserComponent,
    UserCourseBarComponent,
    GravatarDirective
  ],
  providers: [
    UtilsService,
    ErrorService
  ],
  exports: [
    ErrorMessageComponent,
    InfoMessageComponent,
    LanguageSelectorComponent,
    ModalConfirmComponent,
    AudioFileComponent,
    FieldMessagesComponent,
    UserComponent,
    UserCourseBarComponent,
    GravatarDirective,
    CommonModule,
    HttpModule,
    MarkdownModule
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: [
        UtilsService,
        ErrorService
      ]
    };
  }
}
