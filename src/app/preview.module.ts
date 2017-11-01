import {NgModule, ModuleWithProviders} from '@angular/core';
import {SharedModule} from './shared.module';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {CommonModule} from '@angular/common';

import {PreviewService} from './services/preview.service';
import {PreviewQuestionComponent} from './components/build/preview-question.component';
import {LearnQuestionComponent} from './components/learn/question.component';
import {WordColorDirective} from './directives/word-color.directive';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    HttpModule,
    FormsModule
  ],
  declarations: [
    PreviewQuestionComponent,
    LearnQuestionComponent,
    WordColorDirective
  ],
  providers: [
    PreviewService
  ],
  exports: [
    PreviewQuestionComponent,
    LearnQuestionComponent,
    WordColorDirective
  ]
})
export class PreviewModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: PreviewModule,
      providers: [
        PreviewService
      ]
    };
  }
}
