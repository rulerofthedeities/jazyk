import {Routes} from '@angular/router';
import {LearnComponent} from './components/learn/learn.component';
import {CoursesComponent} from './components/learn/courses.component';

export const routes: Routes = [
  {
    path: 'course/:id',
    component: LearnComponent
  },
  {
    path: 'courses',
    component: CoursesComponent
  }
];
