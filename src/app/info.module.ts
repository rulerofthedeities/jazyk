import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';

import {routes} from './info.routes';

import {InfoService} from './services/info.service';

import {InfoComponent} from './components/info/info.component';

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    InfoService
  ],
  declarations: [
    InfoComponent
  ]
})
export class InfoModule {}
