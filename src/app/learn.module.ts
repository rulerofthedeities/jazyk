import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';

import {routes} from './learn.routes';

import {LearnService} from './services/learn.service';
import {TimeService} from './services/time.service';
import {AudioService} from './services/audio.service';

import {LearnCoursesComponent} from './components/learn/courses.component';
import {LearnCoursesUserComponent} from './components/learn/courses-user.component';
import {LearnCourseComponent} from './components/learn/course.component';
import {LearnCourseSummaryComponent} from './components/learn/course-summary.component';
import {LearnCourseUserComponent} from './components/learn/course-user.component';
import {LearnLessonSelectorComponent} from './components/learn/lesson-selector.component';
import {LearnIntroComponent} from './components/learn/step-intro.component';
import {LearnStudyComponent} from './components/learn/step-study.component';
import {LearnPractiseComponent} from './components/learn/step-practise.component';
import {LearnOverviewComponent} from './components/learn/step-overview.component';
import {LearnReviewComponent} from './components/learn/step-review.component';
import {LearnSettingsComponent} from './components/learn/settings.component';
import {LearnCompletedListComponent} from './components/learn/completed-list.component';
import {LearnPointsCompletedComponent} from './components/learn/points-completed.component';
import {LearnPointsEarnedComponent} from './components/learn/points-earned.component';
import {LearnQuestionComponent} from './components/learn/question.component';
import {LearnBulletsComponent} from './components/learn/bullets.component';
import {LearnLevelBarComponent} from './components/learn/learnlevel-bar.component';
import {LearnWordFieldComponent} from './components/learn/word-field.component';
import {LearnWordChoicesComponent} from './components/learn/word-choices.component';
import {LearnSentenceComponent} from './components/learn/sentence.component';
import {LearnQAComponent} from './components/learn/qa.component';
import {LearnKeyboardComponent} from './components/learn/keyboard.component';
import {LearnCountdownComponent} from './components/learn/countdown.component';

import {WordColorDirective} from './directives/word-color.directive';

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    LearnService,
    TimeService,
    AudioService
  ],
  declarations: [
    LearnCoursesComponent,
    LearnCoursesUserComponent,
    LearnCourseSummaryComponent,
    LearnCourseUserComponent,
    LearnCourseComponent,
    LearnLessonSelectorComponent,
    LearnIntroComponent,
    LearnStudyComponent,
    LearnPractiseComponent,
    LearnOverviewComponent,
    LearnReviewComponent,
    LearnSettingsComponent,
    LearnCompletedListComponent,
    LearnPointsCompletedComponent,
    LearnPointsEarnedComponent,
    LearnQuestionComponent,
    LearnBulletsComponent,
    LearnLevelBarComponent,
    LearnWordFieldComponent,
    LearnWordChoicesComponent,
    LearnSentenceComponent,
    LearnQAComponent,
    LearnKeyboardComponent,
    LearnCountdownComponent,
    WordColorDirective
  ]
})
export class LearnModule {}
