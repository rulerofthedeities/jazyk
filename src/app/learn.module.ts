import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';

import {routes} from './learn.routes';

import {LearnService} from './services/learn.service';
import {TimeService} from './services/time.service';

import {LearnCoursesComponent} from './components/learn/courses.component';
import {LearnCourseComponent} from './components/learn/course.component';
import {LearnCourseSummaryComponent} from './components/learn/course-summary.component';
import {LearnStudyComponent} from './components/learn/study.component';
import {LearnPractiseComponent} from './components/learn/practise.component';
import {LearnTestComponent} from './components/learn/test.component';
import {LearnSettingsComponent} from './components/learn/settings.component';
import {LearnCompletedListComponent} from './components/learn/completed-list.component';
import {LearnQuestionComponent} from './components/learn/question.component';
import {LearnBulletsComponent} from './components/learn/bullets.component';
import {LearnAnswerTestComponent} from './components/learn/answer-test.component';

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
