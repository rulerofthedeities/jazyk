import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReadnListenModule } from './readnlisten.module';

import { routes } from './read.routes';

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';


@NgModule({
  imports: [
    RouterModule.forChild(routes),
    ReadnListenModule
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
