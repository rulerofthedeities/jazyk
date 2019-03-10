import { NgModule, ModuleWithProviders } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from './shared.module';
import { CommonModule } from '@angular/common';

import { ReadnListenService } from './services/readnlisten.service';
import { RevisionService } from './services/revision.service';
import { WordListService } from './services/word-list.service';

import { CountdownComponent } from './components/readnlisten/countdown.component';
import { BookLanguagesBarComponent } from './components/readnlisten/languages-bar.component';
import { BookFilterBarComponent } from './components/readnlisten/filter-bar.component';
import { BookSentencesComponent } from './components/readnlisten/book-sentences.component';
import { BookBulletsComponent } from './components/readnlisten/book-bullets.component';
import { BookResultsComponent } from './components/readnlisten/book-results.component';
import { BookTranslationComponent } from './components/readnlisten/book-translation.component';
import { MachineTranslationComponent } from './components/readnlisten/machine-translation.component';
import { BookContextComponent } from './components/readnlisten/book-context.component';
import { BookSuggestionsComponent } from './components/readnlisten/book-suggestions.component';
import { BookTabComponent } from './components/readnlisten/book-tab.component';
import { SentenceComponent } from './components/readnlisten/sentence.component';
import { AudioFileComponent } from './components/fields/audio-file.component';
import { RegionFlagComponent } from './components/fields/region-flag.component';
import { ModalPromotionComponent } from './components/modals/modal-promotion.component';
import { BookRevisionComponent } from './components/revision/book-revision.component';
import { BookWordListComponent } from './components/wordlist/word-list.component';
import { BookTitleComponent } from './components/readnlisten/book-title.component';

import { FocusDirective } from './directives/focus.directive';
import { WordColorDirective } from './directives/word-color.directive';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule
  ],
  declarations: [
    AudioFileComponent,
    RegionFlagComponent,
    CountdownComponent,
    BookLanguagesBarComponent,
    BookFilterBarComponent,
    BookSentencesComponent,
    BookBulletsComponent,
    BookResultsComponent,
    BookTranslationComponent,
    MachineTranslationComponent,
    BookContextComponent,
    BookSuggestionsComponent,
    BookTabComponent,
    SentenceComponent,
    ModalPromotionComponent,
    BookRevisionComponent,
    BookWordListComponent,
    BookTitleComponent,
    FocusDirective,
    WordColorDirective
  ],
  providers: [
    ReadnListenService,
    RevisionService,
    WordListService
  ],
  exports: [
    AudioFileComponent,
    RegionFlagComponent,
    CountdownComponent,
    BookLanguagesBarComponent,
    BookFilterBarComponent,
    BookSentencesComponent,
    BookBulletsComponent,
    BookResultsComponent,
    BookTranslationComponent,
    MachineTranslationComponent,
    BookContextComponent,
    BookSuggestionsComponent,
    BookTabComponent,
    SentenceComponent,
    ModalPromotionComponent,
    BookRevisionComponent,
    BookWordListComponent,
    BookTitleComponent,
    FocusDirective,
    WordColorDirective
  ]
})
export class ReadnListenModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: ReadnListenModule,
      providers: [
        ReadnListenService,
        RevisionService,
        WordListService
      ]
    };
  }
}
