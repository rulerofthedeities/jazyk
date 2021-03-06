import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';

import { ReadnListenService } from './services/readnlisten.service';
import { RevisionService } from './services/revision.service';
import { WordListService } from './services/word-list.service';
import { TranslationService } from './services/translation.service';

import { CountdownComponent } from './components/readnlisten/countdown.component';
import { BookSentencesComponent } from './components/readnlisten/book-sentences.component';
import { BookBulletsComponent } from './components/readnlisten/book-bullets.component';
import { BookResultsComponent } from './components/readnlisten/book-results.component';
import { BookTranslationComponent } from './components/readnlisten/book-translation.component';
import { MachineTranslationComponent } from './components/readnlisten/machine-translation.component';
import { BookContextComponent } from './components/readnlisten/book-context.component';
import { BookSuggestionsComponent } from './components/readnlisten/book-suggestions.component';
import { BookTabComponent } from './components/readnlisten/book-tab.component';
import { SentenceComponent } from './components/readnlisten/sentence.component';
import { RegionFlagComponent } from './components/fields/region-flag.component';
import { ModalPromotionComponent } from './components/modals/modal-promotion.component';
import { BookRevisionComponent } from './components/revision/book-revision.component';
import { BookRevisionSentencesComponent } from './components/revision/book-revision-sentences.component';
import { BookGlossaryComponent } from './components/glossaries/glossary.component';
import { ExternalWordTranslationComponent } from './components/glossaries/external-translation.component';
import { AdminWordTranslationComponent } from './components/glossaries/admin-translation.component';
import { UserWordTranslationComponent } from './components/glossaries/user-translation.component';
import { BookTitleComponent } from './components/readnlisten/book-title.component';

import { FocusDirective } from './directives/focus.directive';
import { WordColorDirective } from './directives/word-color.directive';

@NgModule({
  imports: [
    SharedModule
  ],
  declarations: [
    RegionFlagComponent,
    CountdownComponent,
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
    BookRevisionSentencesComponent,
    BookGlossaryComponent,
    ExternalWordTranslationComponent,
    AdminWordTranslationComponent,
    UserWordTranslationComponent,
    BookTitleComponent,
    FocusDirective,
    WordColorDirective
  ],
  providers: [
    ReadnListenService,
    RevisionService,
    WordListService,
    TranslationService
  ],
  exports: [
    RegionFlagComponent,
    CountdownComponent,
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
    BookRevisionSentencesComponent,
    BookGlossaryComponent,
    ExternalWordTranslationComponent,
    AdminWordTranslationComponent,
    BookTitleComponent,
    FocusDirective,
    WordColorDirective
  ]
})
export class ReadnListenModule {
}
