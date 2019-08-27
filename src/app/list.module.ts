import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';

import { StoriesService } from './services/stories.service';

import { StoryAttributionComponent } from './components/stories/story-attribution.component';
import { StoryButtonsComponent } from './components/stories/story-buttons.component';
import { BookLicenseComponent } from './components/readnlisten/book-license.component';
import { LinkFieldComponent } from './components/fields/link-field.component';

import { AuthInterceptor } from './interceptors/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

@NgModule({
  imports: [
    SharedModule
  ],
  providers: [
    StoriesService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  declarations: [
    StoryAttributionComponent,
    StoryButtonsComponent,
    BookLicenseComponent,
    LinkFieldComponent
  ],
  exports: [
    SharedModule,
    StoryAttributionComponent,
    StoryButtonsComponent,
    BookLicenseComponent,
    LinkFieldComponent
  ]
})

export class ListModule {}
