import {Routes} from '@angular/router';
import {LearnComponent} from './components/learn/learn.component';
import {CoursesComponent} from './components/learn/courses.component';

export const routes: Routes = [
  {
    path: '',
    component: LearnComponent
  },
  {
    path: 'courses',
    component: CoursesComponent
  }
];
