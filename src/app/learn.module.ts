import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';

import {routes} from './learn.routes';

import {LearnService} from './services/learn.service';
import {TimeService} from './services/time.service';

import {LearnCoursesComponent} from './components/learn/learn-courses.component';
import {LearnCourseComponent} from './components/learn/learn-course.component';
import {LearnCourseSummaryComponent} from './components/learn/learn-course-summary.component';
import {LearnStudyComponent} from './components/learn/learn-study.component';
import {LearnPractiseComponent} from './components/learn/learn-practise.component';
import {LearnTestComponent} from './components/learn/learn-test.component';
import {LearnSettingsComponent} from './components/learn/learn-settings.component';
import {LearnCompletedListComponent} from './components/learn/learn-completed-list.component';
import {LearnQuestionComponent} from './components/learn/learn-question.component';
import {LearnBulletsComponent} from './components/learn/learn-bullets.component';
import {LearnAnswerTestComponent} from './components/learn/learn-answer-test.component';

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
    LearnCoursesComponent,
    LearnCourseSummaryComponent,
    LearnCourseComponent,
    LearnStudyComponent,
    LearnPractiseComponent,
    LearnTestComponent,
    LearnSettingsComponent,
    LearnCompletedListComponent,
    LearnQuestionComponent,
    LearnBulletsComponent,
    LearnAnswerTestComponent,
    GetKeyPressDirective,
    WordColorDirective
  ]
})
export class LearnModule {}
