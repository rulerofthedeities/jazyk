import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    children: [
      {path: 'learn', loadChildren: './learn.module#LearnModule'},
      {path: 'build', loadChildren: './build.module#BuildModule'}
    ]
  }
];
