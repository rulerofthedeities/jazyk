import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';

import {routes} from './learn.routes';

import {LearnService} from './services/learn.service';

import {LearnComponent} from './components/learn/learn.component';
import {CoursesComponent} from './components/learn/courses.component';


@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    LearnService
  ],
  declarations: [
    LearnComponent,
    CoursesComponent
  ]
})
export class LearnModule {}
