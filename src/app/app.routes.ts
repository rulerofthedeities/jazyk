import {Routes} from '@angular/router';
import {BaseComponent} from './components/base.component';
import {HomeComponent} from './components/home/home.component';
import {UserComponent} from './components/user/user.component';
import {InfoComponent} from './components/info/info.component';
import {PageNotFoundComponent} from './components/not-found.component';
import {UserResolver} from './resolves/user.resolver';
import {AuthGuard} from './services/auth-guard.service';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '',
    component: BaseComponent,
    resolve: {user: UserResolver},
    children: [
      {path: 'home', component: HomeComponent},
      {path: 'auth', loadChildren: './auth.module#AuthModule'},
      {path: 'learn', loadChildren: './learn.module#LearnModule'},
      {path: 'build', loadChildren: './build.module#BuildModule', canActivate: [AuthGuard]},
      {path: 'user', loadChildren: './user.module#UserModule', canActivate: [AuthGuard]},
      {path: 'info', loadChildren: './info.module#InfoModule'},
      {path: 'u/:name', component: UserComponent, canActivate: [AuthGuard]},
      {path: '404', component: PageNotFoundComponent},
      {path: '**', redirectTo: '404', data : {path : 'images'}}
    ]
  }
];
