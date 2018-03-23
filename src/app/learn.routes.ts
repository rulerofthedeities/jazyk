import {Routes} from '@angular/router';
import {LearnCourseComponent} from './components/learn/course.component';
import {LearnCoursesComponent} from './components/learn/courses.component';
import {LearnCoursesUserComponent} from './components/learn/courses-user.component';
import {AuthGuard} from './services/auth-guard.service';

export const routes: Routes = [
  {
    path: '',
    component: LearnCoursesUserComponent
  },
  {
    path: 'course/:id',
    component: LearnCourseComponent
  },
  {
    path: 'course/:id/:step',
    component: LearnCourseComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'courses',
    component: LearnCoursesComponent,
    canActivate: [AuthGuard]
  }
];
