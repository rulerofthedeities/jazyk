import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    children: [
      {path: 'home', loadChildren: './learn.module#LearnModule'},
      {path: 'build', loadChildren: './build.module#BuildModule'}
    ]
  }
];
