import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { routes } from './stories.routes';
import { StoriesService } from './services/stories.service';
import { FilterService } from './services/filter.service';

import { StoryListComponent } from './components/stories/list.component';
import { BookLanguagesBarComponent } from './components/stories/languages-bar.component';
import { BookFilterBarComponent } from './components/stories/filter-bar.component';
import { ListSelectorComponent } from './components/fields/list-selector.component';
import { StorySummaryComponent } from './components/stories/story-summary.component';

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    FormsModule,
    InfiniteScrollModule
  ],
  providers: [
    FilterService,
    StoriesService,
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true}
  ],
  declarations: [
    StoryListComponent,
    BookLanguagesBarComponent,
    BookFilterBarComponent,
    ListSelectorComponent,
    StorySummaryComponent
  ]
})

export class StoriesModule {}
