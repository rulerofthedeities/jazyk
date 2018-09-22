import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReadnListenModule } from './readnlisten.module';

import { ReadService } from './services/read.service';

import { routes } from './read.routes';
import { ReadComponent } from './components/read/read.component';
import { BookSentencesComponent } from './components/read/book-sentences.component';
import { BookTranslationComponent } from './components/read/book-translation.component';
import { BookContextComponent } from './components/read/book-context.component';
import { BookBulletsComponent } from './components/read/book-bullets.component';
import { BookResultsComponent } from './components/read/book-results.component';
import { BookSuggestionsComponent } from './components/read/book-suggestions.component';
import { BookTabComponent } from './components/read/book-tab.component';

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';


@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReadnListenModule
  ],
  providers: [
    ReadService,
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true}
  ],
  declarations: [
    ReadComponent,
    BookSentencesComponent,
    BookTranslationComponent,
    BookContextComponent,
    BookBulletsComponent,
    BookResultsComponent,
    BookSuggestionsComponent,
    BookTabComponent
  ]
})
export class ReadModule {}
