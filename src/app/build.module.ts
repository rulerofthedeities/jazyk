import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';
import {HttpModule} from '@angular/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {routes} from './build.routes';

import {ErrorService} from './services/error.service';
import {UtilsService} from './services/utils.service';

import {BuildComponent} from './components/build/build.component';
import {BuildCourseComponent} from './components/build/course.component';
import {BuildLessonComponent} from './components/build/lesson.component';
import {LanguageSelectorComponent} from './components/build/language-selector.component';


@NgModule({
  imports: [
    SharedModule,
    HttpModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    ErrorService,
    UtilsService
  ],
  declarations: [
    BuildComponent,
    BuildCourseComponent,
    BuildLessonComponent,
    LanguageSelectorComponent
  ]
})
export class BuildModule {}
