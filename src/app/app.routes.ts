import {Routes} from '@angular/router';
import {HomeComponent} from './components/home.component';
import {UserResolver} from './resolves/user.resolver';

export const routes: Routes = [
  {path: '', component: HomeComponent, resolve: {user: UserResolver}},
  {path: 'auth', loadChildren: './auth.module#AuthModule'},
  {path: 'learn', loadChildren: './learn.module#LearnModule'},
  {path: 'build', loadChildren: './build.module#BuildModule'}
];
