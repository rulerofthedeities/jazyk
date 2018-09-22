import { NgModule, ModuleWithProviders } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'ngx-tooltip';
import { UtilsService } from './services/utils.service';

import { ErrorMessageComponent } from './components/msg/error-message.component';
import { InfoMessageComponent } from './components/msg/info-message.component';
import { LanguageSelectorComponent } from './components/fields/language-selector.component';
import { ModalConfirmComponent } from './components/modals/modal-confirm.component';
import { FieldMessagesComponent } from './components/msg/field-messages.component';
import { UserComponent } from './components/user/user.component';
import { UserCompactProfileComponent } from './components/user/compact-profile.component';
import { MailFieldComponent } from './components/fields/message.component';
import { GravatarDirective } from './directives/gravatar.directive';
import { GetKeyPressDirective } from './directives/get-key-pressed.directive';
import { ToggleComponent } from './components/fields/toggle.component';
import { LoaderComponent } from './components/loader.component';
import { BookSummaryComponent } from './components/read/book-summary.component';
import { ModalRanksComponent } from './components/modals/modal-ranks.component';
import { SanitizeHtmlPipe } from './pipes/sanitize-html.pipe';
import { ScorePipe } from './pipes/score.pipe';
import { PieChartComponent } from './components/read/pie-chart.component';
import { BookTpeComponent } from './components/read/book-tpe.component';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    TooltipModule
  ],
  declarations: [
    ErrorMessageComponent,
    InfoMessageComponent,
    LanguageSelectorComponent,
    ModalConfirmComponent,
    FieldMessagesComponent,
    UserComponent,
    UserCompactProfileComponent,
    MailFieldComponent,
    GravatarDirective,
    GetKeyPressDirective,
    ToggleComponent,
    LoaderComponent,
    BookSummaryComponent,
    ModalRanksComponent,
    ScorePipe,
    SanitizeHtmlPipe,
    PieChartComponent,
    BookTpeComponent
  ],
  providers: [
    UtilsService
  ],
  exports: [
    CommonModule,
    TooltipModule,
    ErrorMessageComponent,
    InfoMessageComponent,
    LanguageSelectorComponent,
    ModalConfirmComponent,
    FieldMessagesComponent,
    UserComponent,
    UserCompactProfileComponent,
    MailFieldComponent,
    GravatarDirective,
    GetKeyPressDirective,
    ToggleComponent,
    LoaderComponent,
    BookSummaryComponent,
    ModalRanksComponent,
    ScorePipe,
    SanitizeHtmlPipe,
    PieChartComponent,
    BookTpeComponent
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: [
        UtilsService
      ]
    };
  }
}
