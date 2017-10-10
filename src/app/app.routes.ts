import {Routes} from '@angular/router';
import {BaseComponent} from './components/base.component';
import {HomeComponent} from './components/home.component';
import {UserComponent} from './components/user/user.component';
import {UserResolver} from './resolves/user.resolver';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '',
    component: BaseComponent,
    resolve: {
      user: UserResolver
    },
    children: [
      {path: 'home', component: HomeComponent},
      {path: 'auth', loadChildren: './auth.module#AuthModule'},
      {path: 'learn', loadChildren: './learn.module#LearnModule'},
      {path: 'build', loadChildren: './build.module#BuildModule'},
      {path: 'user', loadChildren: './user.module#UserModule'},
      {path: 'u/:id', component: UserComponent}
    ]
  }
];
