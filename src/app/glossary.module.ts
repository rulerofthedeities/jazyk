import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';
import { RouterModule } from '@angular/router';
import { ReadnListenModule } from './readnlisten.module';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { routes } from './glossary.routes';
import { BookFlashCardsComponent } from './components/glossaries/flashcards.component';
import { BookFlashCardComponent } from './components/glossaries/flashcard.component';
import { BookFlashCardsResultComponent } from './components/glossaries/flashcards-result.component';
import { GlossaryWordComponent} from './components/glossaries/glossary-word.component';
import { FilterService } from './services/filter.service';

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';


@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    ReadnListenModule,
    InfiniteScrollModule
  ],
  providers: [
    FilterService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  declarations: [
    GlossaryWordComponent,
    BookFlashCardsComponent,
    BookFlashCardComponent,
    BookFlashCardsResultComponent
  ]
})
export class GlossaryModule {}
