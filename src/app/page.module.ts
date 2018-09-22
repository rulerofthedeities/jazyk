import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';
import { RouterModule } from '@angular/router';
import { routes } from './page.routes';
import { PageService } from './services/page.service';
import { InfoComponent } from './components/pages/info.component';

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    PageService
  ],
  declarations: [
    InfoComponent
  ]
})
export class PageModule {}
