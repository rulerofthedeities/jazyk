import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {PreviewModule} from './preview.module';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DndModule} from 'ng2-dnd'; // Sorting

import {routes} from './build.routes';

import {BuildService} from './services/build.service';

import {BuildComponent} from './components/build/build.component';
import {BuildCoursesComponent} from './components/build/courses.component';
import {BuildCourseComponent} from './components/build/course.component';
import {BuildCourseHeaderComponent} from './components/build/course-header.component';
import {BuildCourseHeaderBarComponent} from './components/build/course-header-bar.component';
import {BuildChapterComponent} from './components/build/chapter.component';
import {BuildChapterLessonsComponent} from './components/build/chapter-lessons.component';
import {BuildLessonComponent} from './components/build/lesson.component';
import {BuildLessonHeaderComponent} from './components/build/lesson-header.component';
import {BuildLessonTabsComponent} from './components/build/lesson-tabs.component';
import {BuildLessonIntroComponent} from './components/build/lesson-intro.component';
import {BuildLessonDialogueComponent} from './components/build/lesson-dialogue.component';
import {BuildLessonsComponent} from './components/build/lessons.component';
import {BuildExerciseComponent} from './components/build/exercise.component';
import {BuildExerciseListComponent} from './components/build/exercise-list.component';
import {BuildSelectComponent} from './components/build/exercise-select.component';
import {BuildQAComponent} from './components/build/exercise-qa.component';
import {BuildFillInComponent} from './components/build/exercise-fillin.component';
import {BuildGenusComponent} from './components/build/exercise-genus.component';
import {BuildComparisonComponent} from './components/build/exercise-comparison.component';
import {AutocompleteComponent} from './components/fields/autocomplete.component';
import {FilterListComponent} from './components/fields/filter-list.component';
import {ImageListComponent} from './components/fields/image-list.component';
import {AudioListComponent} from './components/fields/audio-list.component';
import {SanitizeHtmlPipe} from './pipes/sanitize-html.pipe';

@NgModule({
  imports: [
    SharedModule,
    PreviewModule,
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
    BuildCourseHeaderComponent,
    BuildCourseHeaderBarComponent,
    BuildChapterComponent,
    BuildChapterLessonsComponent,
    BuildLessonsComponent,
    BuildLessonComponent,
    BuildLessonHeaderComponent,
    BuildLessonTabsComponent,
    BuildLessonIntroComponent,
    BuildLessonDialogueComponent,
    BuildExerciseComponent,
    BuildExerciseListComponent,
    BuildSelectComponent,
    BuildQAComponent,
    BuildFillInComponent,
    BuildGenusComponent,
    BuildComparisonComponent,
    AutocompleteComponent,
    FilterListComponent,
    ImageListComponent,
    AudioListComponent,
    SanitizeHtmlPipe
  ]
})
export class BuildModule {}
