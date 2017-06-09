import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';

import {routes} from './learn.routes';

import {LearnService} from './services/learn.service';

import {CoursesComponent} from './components/learn/courses.component';
import {CourseSummaryComponent} from './components/learn/course-summary.component';
import {LearnComponent} from './components/learn/learn.component';
import {LearnStudyComponent} from './components/learn/learn-study.component';

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    LearnService
  ],
  declarations: [
    CoursesComponent,
    CourseSummaryComponent,
    LearnComponent,
    LearnStudyComponent
  ]
})
export class LearnModule {}
