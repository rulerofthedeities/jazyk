import {Routes} from '@angular/router';
import {LearnCourseComponent} from './components/learn/course.component';
import {LearnCoursesComponent} from './components/learn/courses.component';

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
