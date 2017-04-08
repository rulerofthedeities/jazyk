import {Routes} from '@angular/router';
import {BuildComponent} from './components/build/build.component';
import {BuildCourseComponent} from './components/build/course.component';
import {BuildLessonComponent} from './components/build/lesson.component';

export const routes: Routes = [
  {
    path: '',
    component: BuildComponent,
    children: [
      {path: 'course/:id', component: BuildCourseComponent}
    ]
  }
];
