import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReadnListenModule } from './readnlisten.module';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { routes } from './read.routes';
import { ReadComponent } from './components/read/read.component';
import { FilterService } from './services/filter.service';

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';


@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReadnListenModule,
    InfiniteScrollModule
  ],
  providers: [
    FilterService,
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true}
  ],
  declarations: [
    ReadComponent
  ]
})
export class ReadModule {}
