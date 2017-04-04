import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';
import {HttpModule} from '@angular/http';

import {routes} from './learn.routes';

import {ErrorService} from './services/error.service';
//import {LearnService} from './services/jazyk.service';

import {LearnComponent} from './components/learn/learn.component';

@NgModule({
  imports: [
    SharedModule,
    HttpModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    ErrorService
  ],
  declarations: [
    LearnComponent
  ]
})
export class LearnModule {}
