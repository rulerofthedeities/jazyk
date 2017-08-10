import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';

import {routes} from './learn.routes';

import {LearnService} from './services/learn.service';
import {TimeService} from './services/time.service';

import {LearnCoursesComponent} from './components/learn/courses.component';
import {LearnCoursesUserComponent} from './components/learn/courses-user.component';
import {LearnCourseComponent} from './components/learn/course.component';
import {LearnCourseSummaryComponent} from './components/learn/course-summary.component';
import {LearnCourseUserComponent} from './components/learn/course-user.component';
import {LearnStudyComponent} from './components/learn/step-study.component';
import {LearnPractiseComponent} from './components/learn/step-practise.component';
import {LearnTestComponent} from './components/learn/step-test.component';
import {LearnSettingsComponent} from './components/learn/settings.component';
import {LearnCompletedListComponent} from './components/learn/completed-list.component';
import {LearnQuestionComponent} from './components/learn/question.component';
import {LearnBulletsComponent} from './components/learn/bullets.component';
import {LearnAnswerFieldComponent} from './components/learn/answer-field.component';
import {LearnAnswerChoicesComponent} from './components/learn/answer-choices.component';
import {LearnKeyboardComponent} from './components/learn/keyboard.component';

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
    LearnCoursesUserComponent,
    LearnCourseSummaryComponent,
    LearnCourseUserComponent,
    LearnCourseComponent,
    LearnStudyComponent,
    LearnPractiseComponent,
    LearnTestComponent,
    LearnSettingsComponent,
    LearnCompletedListComponent,
    LearnQuestionComponent,
    LearnBulletsComponent,
    LearnAnswerFieldComponent,
    LearnAnswerChoicesComponent,
    LearnKeyboardComponent,
    GetKeyPressDirective,
    WordColorDirective
  ]
})
export class LearnModule {}
