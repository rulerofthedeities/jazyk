import { Routes } from '@angular/router';
import { BaseComponent } from './components/base.component';
import { HomeComponent } from './components/home/home.component';
import { UserComponent } from './components/user/user.component';
import { PageNotFoundComponent } from './components/not-found.component';
import { UserResolver } from './resolves/user.resolver';
import { AuthGuard } from './guards/auth.guard';

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
        path: 'read',
        loadChildren: './read.module#ReadModule',
        canActivate: [AuthGuard]
      },
      {
        path: 'listen',
        loadChildren: './listen.module#ListenModule',
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
