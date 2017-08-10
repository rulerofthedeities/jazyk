import {Routes} from '@angular/router';
import {LearnCourseComponent} from './components/learn/course.component';
import {LearnCoursesComponent} from './components/learn/courses.component';
import {LearnCoursesUserComponent} from './components/learn/courses-user.component';

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
    path: 'courses',
    component: LearnCoursesComponent
  }
];
