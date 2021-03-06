import { Routes } from '@angular/router';
import { BaseComponent } from './components/base.component';
import { HomeComponent } from './components/home/home.component';
import { UserComponent } from './components/user/user.component';
import { PageNotFoundComponent } from './components/main/not-found.component';
import { UserResolver } from './resolves/user.resolver';
import { AuthGuard } from './guards/auth.guard';
import { InfoComponent } from './components/pages/info.component';
import { ManualComponent } from './components/pages/manual.component';
import { BooklistComponent } from './components/pages/book-list.component';
import { LeaderboardComponent } from './components/main/leaderboard.component';

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
        path: 'dashboard',
        component: HomeComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'leaderboard',
        component: LeaderboardComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'auth',
        loadChildren: './auth.module#AuthModule'
      },
      {
        path: 'read',
        children: [
          {
            path: '',
            loadChildren: './stories.module#StoriesModule',
            data :
            {
              tpe : 'read'
            },
            canActivate: [AuthGuard]
          },
          {
            path: 'book',
            loadChildren: './read.module#ReadModule',
            canActivate: [AuthGuard]
          }
        ]
      },
      {
        path: 'listen',
        children: [
          {
            path: '',
            loadChildren: './stories.module#StoriesModule',
            data :
            {
              tpe : 'listen'
            },
            canActivate: [AuthGuard]
          },
          {
            path: 'book',
            loadChildren: './listen.module#ListenModule',
            canActivate: [AuthGuard]
          }
        ]
      },
      {
        path: 'glossaries',
        children: [
          {
            path: '',
            loadChildren: './stories.module#StoriesModule',
            data :
            {
              tpe : 'glossary'
            },
            canActivate: [AuthGuard]
          },
          {
            path: 'glossary',
            loadChildren: './glossary.module#GlossaryModule',
            canActivate: [AuthGuard]
          }
        ]
      },
      {
        path: 'user',
        loadChildren: './user.module#UserModule',
        canActivate: [AuthGuard]
      },
      {
        path: 'info',
        // loadChildren: './page.module#PageModule'
        children: [
          {
            path: 'booklist',
            component: BooklistComponent
          },
          {
            path: ':page',
            component: InfoComponent
          }
        ]
      },
      {
        path: 'manual',
        children: [
          {
            path: '',
            redirectTo: '/manual/index',
            pathMatch: 'full' },
          {
            path: ':page',
            component: ManualComponent
          }
        ]
      },
      {
        path: 'u/:name',
        component: UserComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'v',
        loadChildren: './verify.module#VerifyModule'
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
