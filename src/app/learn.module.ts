import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {PreviewModule} from './preview.module';
import {RouterModule} from '@angular/router';

import {routes} from './learn.routes';

import {LearnService} from './services/learn.service';
import {TimeService} from './services/time.service';
import {AudioService} from './services/audio.service';

import {LearnCoursesComponent} from './components/learn/courses.component';
import {LearnCoursesUserComponent} from './components/learn/courses-user.component';
import {LearnCourseComponent} from './components/learn/course.component';
import {LearnIntroComponent} from './components/learn/step-intro.component';
import {LearnDialogueComponent} from './components/learn/step-dialogue.component';
import {LearnStudyComponent} from './components/learn/step-study.component';
import {LearnPractiseComponent} from './components/learn/step-practise.component';
import {LearnOverviewComponent} from './components/learn/step-overview.component';
import {LearnLessonOverviewComponent} from './components/learn/lesson-overview.component';
import {LearnReviewComponent} from './components/learn/step-review.component';
import {LearnDifficultComponent} from './components/learn/step-difficult.component';
import {LearnExamComponent} from './components/learn/step-exam.component';
import {LearnSettingsComponent} from './components/learn/settings.component';
import {LearnCompletedListComponent} from './components/learn/completed-list.component';
import {LearnPointsCompletedComponent} from './components/learn/points-completed.component';
import {LearnPointsEarnedComponent} from './components/learn/points-earned.component';
import {LearnBulletsComponent} from './components/learn/bullets.component';
import {LearnLevelBarComponent} from './components/learn/learnlevel-bar.component';
import {LearnWordFieldComponent} from './components/learn/exercise-word-field.component';
import {LearnWordChoicesComponent} from './components/learn/exercise-word-choices.component';
import {LearnCountdownComponent} from './components/learn/countdown.component';
import {LearnTimerComponent} from './components/learn/timer.component';
import {LearnSignUpComponent} from './components/learn/signup.component';
import {ModalPromotionComponent} from './components/modals/modal-promotion.component';
import {ScrollToDirective} from './directives/scroll-to.directive';
import {ErrorInterceptor} from './interceptors/error.interceptor';
import {AuthInterceptor} from './interceptors/auth.interceptor';
import {HTTP_INTERCEPTORS} from '@angular/common/http';

@NgModule({
  imports: [
    SharedModule,
    PreviewModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    LearnService,
    TimeService,
    AudioService,
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true},
  ],
  declarations: [
    LearnCoursesComponent,
    LearnCoursesUserComponent,
    LearnCourseComponent,
    LearnIntroComponent,
    LearnDialogueComponent,
    LearnStudyComponent,
    LearnPractiseComponent,
    LearnOverviewComponent,
    LearnLessonOverviewComponent,
    LearnReviewComponent,
    LearnDifficultComponent,
    LearnExamComponent,
    LearnSettingsComponent,
    LearnCompletedListComponent,
    LearnPointsCompletedComponent,
    LearnPointsEarnedComponent,
    LearnBulletsComponent,
    LearnLevelBarComponent,
    LearnWordFieldComponent,
    LearnWordChoicesComponent,
    LearnCountdownComponent,
    LearnTimerComponent,
    LearnSignUpComponent,
    ModalPromotionComponent,
    ScrollToDirective
  ]
})
export class LearnModule {}
