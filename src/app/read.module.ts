import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from './shared.module';
import { ReadnListenModule } from './readnlisten.module';

import { routes } from './read.routes';

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';


@NgModule({
  imports: [
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
  ]
})

export class ReadModule {}
