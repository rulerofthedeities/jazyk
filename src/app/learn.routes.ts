import {Routes} from '@angular/router';
import {LearnCourseComponent} from './components/learn/course.component';
import {LearnCoursesComponent} from './components/learn/courses.component';
import {AuthGuard} from './services/auth-guard.service';

export const routes: Routes = [
  {
    path: '',
    component: LearnCoursesComponent
  },
  {
    path: 'course/:id',
    component: LearnCourseComponent
  },
  {
    path: 'course/:id/:step',
    component: LearnCourseComponent
  }
];
