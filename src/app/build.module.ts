import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {routes} from './build.routes';

import {BuildService} from './services/build.service';

import {BuildComponent} from './components/build/build.component';
import {BuildCourseComponent} from './components/build/course.component';
import {BuildLessonComponent} from './components/build/lesson.component';
import {BuildLessonsComponent} from './components/build/lessons.component';
import {BuildChapterComponent} from './components/build/chapter.component';
import {AutocompleteComponent} from './components/fields/autocomplete.component';
import {ModalConfirmComponent} from './components/modals/modal-confirm.component';


@NgModule({
  imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    BuildService
  ],
  declarations: [
    BuildComponent,
    BuildCourseComponent,
    BuildLessonComponent,
    BuildLessonsComponent,
    BuildChapterComponent,
    AutocompleteComponent,
    ModalConfirmComponent
  ]
})
export class BuildModule {}
