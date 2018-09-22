import { Routes } from '@angular/router';
import { InfoComponent } from './components/pages/info.component';

export const routes: Routes = [
  {path: ':page', component: InfoComponent}
];
