import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReadnListenModule } from './readnlisten.module';

import { ReadService } from './services/read.service';

import { routes } from './listen.routes';
import { ListenComponent } from './components/listen/listen.component';
import { SentencesTestComponent } from './components/listen/sentences-test.component';
import { SentenceTestComponent } from './components/listen/sentence-test.component';

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
    ListenComponent,
    SentencesTestComponent,
    SentenceTestComponent
  ]
})

export class ListenModule {}
