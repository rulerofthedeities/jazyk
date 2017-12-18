import {Routes} from '@angular/router';
import {InfoComponent} from './components/info/info.component';

export const routes: Routes = [
  {path: ':page', component: InfoComponent}
];
