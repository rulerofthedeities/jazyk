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
    AudioFileComponent
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
