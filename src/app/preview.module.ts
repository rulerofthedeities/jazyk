import {NgModule, ModuleWithProviders} from '@angular/core';
import {SharedModule} from './shared.module';
import {CommonModule} from '@angular/common';

import {PreviewService} from './services/preview.service';
import {PreviewQuestionComponent} from './components/build/preview-question.component';
import {LearnQuestionComponent} from './components/learn/question.component';
import {LearnSelectComponent} from './components/learn/exercise-select.component';
import {LearnQAComponent} from './components/learn/exercise-qa.component';
import {LearnComparisonComponent} from './components/learn/exercise-comparison.component';
import {LearnKeyboardComponent} from './components/learn/keyboard.component';
import {RegionFlagSelectorComponent} from './components/fields/region-flag-selector.component';
import {WordColorDirective} from './directives/word-color.directive';
import {AudioFileComponent} from './components/fields/audio-file.component';
import {RegionFlagComponent} from './components/fields/region-flag.component';
import {DialogueComponent} from './components/learn/dialogue.component';
import {SanitizeHtmlPipe} from './pipes/sanitize-html.pipe';

@NgModule({
  imports: [
    CommonModule,
    SharedModule
  ],
  declarations: [
    PreviewQuestionComponent,
    LearnQuestionComponent,
    LearnSelectComponent,
    LearnQAComponent,
    LearnComparisonComponent,
    LearnKeyboardComponent,
    DialogueComponent,
    RegionFlagSelectorComponent,
    AudioFileComponent,
    RegionFlagComponent,
    WordColorDirective,
    SanitizeHtmlPipe
  ],
  providers: [
    PreviewService
  ],
  exports: [
    PreviewQuestionComponent,
    LearnQuestionComponent,
    LearnSelectComponent,
    LearnQAComponent,
    LearnComparisonComponent,
    LearnKeyboardComponent,
    DialogueComponent,
    RegionFlagSelectorComponent,
    AudioFileComponent,
    RegionFlagComponent,
    WordColorDirective,
    SanitizeHtmlPipe
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
