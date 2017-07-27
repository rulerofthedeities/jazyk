import {Routes} from '@angular/router';
import {LearnCourseComponent} from './components/learn/learn-course.component';
import {LearnCoursesComponent} from './components/learn/learn-courses.component';

export const routes: Routes = [
  {
    path: 'course/:id',
    component: LearnCourseComponent
  },
  {
    path: 'courses',
    component: LearnCoursesComponent
  }
];
