import {Routes} from '@angular/router';
import {HomeComponent} from './components/home.component';

export const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'learn', loadChildren: './learn.module#LearnModule'},
  {path: 'build', loadChildren: './build.module#BuildModule'}
];
