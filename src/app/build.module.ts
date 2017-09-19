import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DndModule} from 'ng2-dnd'; // Sorting

import {routes} from './build.routes';

import {BuildService} from './services/build.service';

import {BuildComponent} from './components/build/build.component';
import {BuildCoursesComponent} from './components/build/courses.component';
import {BuildCourseComponent} from './components/build/course.component';
import {BuildCourseSummaryComponent} from './components/build/course-summary.component';
import {BuildCourseHeaderComponent} from './components/build/course-header.component';
import {BuildCourseHeaderBarComponent} from './components/build/course-header-bar.component';
import {BuildChapterComponent} from './components/build/chapter.component';
import {BuildChapterLessonsComponent} from './components/build/chapter-lessons.component';
import {BuildLessonComponent} from './components/build/lesson.component';
import {BuildLessonHeaderComponent} from './components/build/lesson-header.component';
import {BuildLessonTabsComponent} from './components/build/lesson-tabs.component';
import {BuildLessonIntroComponent} from './components/build/lesson-intro.component';
import {BuildLessonsComponent} from './components/build/lessons.component';
import {BuildExerciseComponent} from './components/build/exercise.component';
import {BuildExerciseListComponent} from './components/build/exercise-list.component';
import {BuildSentenceComponent} from './components/build/sentence.component';
import {AutocompleteComponent} from './components/fields/autocomplete.component';
import {FilterListComponent} from './components/fields/filter-list.component';
import {ImageListComponent} from './components/fields/image-list.component';
import {AudioListComponent} from './components/fields/audio-list.component';
import {FieldMessagesComponent} from './components/msg/field-messages.component';


@NgModule({
  imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    DndModule.forRoot()
  ],
  providers: [
    BuildService
  ],
  declarations: [
    BuildComponent,
    BuildCoursesComponent,
    BuildCourseComponent,
    BuildCourseSummaryComponent,
    BuildCourseHeaderComponent,
    BuildCourseHeaderBarComponent,
    BuildChapterComponent,
    BuildChapterLessonsComponent,
    BuildLessonsComponent,
    BuildLessonComponent,
    BuildLessonHeaderComponent,
    BuildLessonTabsComponent,
    BuildLessonIntroComponent,
    BuildExerciseComponent,
    BuildExerciseListComponent,
    BuildSentenceComponent,
    AutocompleteComponent,
    FilterListComponent,
    ImageListComponent,
    AudioListComponent,
    FieldMessagesComponent
  ]
})
export class BuildModule {}
