import {Routes} from '@angular/router';
import {HomeComponent} from './components/home.component';
import {SignUpComponent} from './components/auth/sign-up.component';

export const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'auth',
    children: [
      {
        path: '',
        redirectTo: '/auth/signin',
        pathMatch: 'full'
      },
      {path: 'signup', component: SignUpComponent}
    ]
  },
  {path: 'learn', loadChildren: './learn.module#LearnModule'},
  {path: 'build', loadChildren: './build.module#BuildModule'}
];
