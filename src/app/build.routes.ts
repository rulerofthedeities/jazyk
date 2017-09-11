import {Routes} from '@angular/router';
import {BuildComponent} from './components/build/build.component';
import {BuildCoursesComponent} from './components/build/courses.component';
import {BuildCourseComponent} from './components/build/course.component';
import {BuildLessonComponent} from './components/build/lesson.component';

export const routes: Routes = [
  {
    path: '',
    component: BuildComponent,
    children: [
      {path: 'courses', component: BuildCoursesComponent},
      {path: 'course/:id', component: BuildCourseComponent},
      {path: 'lesson/:id', component: BuildLessonComponent}
    ]
  }
];
