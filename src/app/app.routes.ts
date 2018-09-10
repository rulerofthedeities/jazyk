import { Routes } from '@angular/router';
import { BaseComponent } from './components/base.component';
import { HomeComponent } from './components/home/home.component';
import { UserComponent } from './components/user/user.component';
import { PageNotFoundComponent } from './components/not-found.component';
import { UserResolver } from './resolves/user.resolver';
import { AuthGuard } from './guards/auth.guard';
import { CanDeactivateGuard } from './guards/deacivate.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '',
    component: BaseComponent,
    resolve: {
      user: UserResolver
    },
    children: [
      {
        path: 'home',
        component: HomeComponent
      },
      {
        path: 'auth',
        loadChildren: './auth.module#AuthModule'
      },
      {
        path: 'learn',
        loadChildren: './learn.module#LearnModule',
        canActivate: [AuthGuard]
      },
      {
        path: 'build',
        loadChildren: './build.module#BuildModule',
        canActivate: [AuthGuard]
      },
      {
        path: 'read',
        loadChildren: './read.module#ReadModule',
        canActivate: [AuthGuard]
      },
      {
        path: 'user',
        loadChildren: './user.module#UserModule',
        canActivate: [AuthGuard]
      },
      {
        path: 'info',
        loadChildren: './page.module#PageModule'
      },
      {
        path: 'u/:name',
        component: UserComponent,
        canActivate: [AuthGuard]
      },
      {
        path: '404',
        component: PageNotFoundComponent
      },
      {
        path: '**',
        redirectTo: '404',
        data :
        {
          path : 'images'
        }
      }
    ]
  }
];
