import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';

import {routes} from './learn.routes';

import {LearnService} from './services/learn.service';
import {TimeService} from './services/time.service';

import {CoursesComponent} from './components/learn/courses.component';
import {CourseSummaryComponent} from './components/learn/course-summary.component';
import {LearnComponent} from './components/learn/learn.component';
import {LearnStudyComponent} from './components/learn/learn-study.component';
import {LearnPractiseComponent} from './components/learn/learn-practise.component';
import {LearnTestComponent} from './components/learn/learn-test.component';
import {LearnSettingsComponent} from './components/learn/learn-settings.component';
import {LearnCompletedListComponent} from './components/learn/learn-completed-list.component';

import {GetKeyPressDirective} from './directives/get-key-pressed.directive';
import {WordColorDirective} from './directives/word-color.directive';

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    LearnService,
    TimeService
  ],
  declarations: [
    CoursesComponent,
    CourseSummaryComponent,
    LearnComponent,
    LearnStudyComponent,
    LearnPractiseComponent,
    LearnTestComponent,
    LearnSettingsComponent,
    LearnCompletedListComponent,
    GetKeyPressDirective,
    WordColorDirective
  ]
})
export class LearnModule {}
