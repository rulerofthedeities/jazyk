import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';

import {ReadService} from './services/read.service';

import {routes} from './read.routes';
import {ReadComponent} from './components/read/read.component';

import {AuthInterceptor} from './interceptors/auth.interceptor';
import {HTTP_INTERCEPTORS} from '@angular/common/http';


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
    ReadComponent
  ]
})
export class ReadModule {}
