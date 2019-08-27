import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SharedModule } from './shared.module';
import { ReadnListenModule } from './readnlisten.module';

import { routes } from './listen.routes';

import { SentencesTestComponent } from './components/listen/sentences-test.component';
import { SentenceTestComponent } from './components/listen/sentence-test.component';

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';


@NgModule({
  imports: [
    FormsModule,
    SharedModule,
    ReadnListenModule,
    RouterModule.forChild(routes)
  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }],
  declarations: [
    SentencesTestComponent,
    SentenceTestComponent
  ]
})

export class ListenModule {}
