import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';
import { RouterModule } from '@angular/router';

import { ReadService } from './services/read.service';

import { routes } from './read.routes';
import { ReadComponent } from './components/read/read.component';
import { BookSummaryComponent } from './components/read/book-summary.component';
import { BookSentencesComponent } from './components/read/book-sentences.component';
import { BookTranslationComponent } from './components/read/book-translation.component';
import { BookContextComponent } from './components/read/book-context.component';
import { BookBulletsComponent } from './components/read/book-bullets.component';
import { BookResultsComponent } from './components/read/book-results.component';

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';


@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    ReadService,
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true}
  ],
  declarations: [
    ReadComponent,
    BookSummaryComponent,
    BookSentencesComponent,
    BookTranslationComponent,
    BookContextComponent,
    BookBulletsComponent,
    BookResultsComponent
  ]
})
export class ReadModule {}
