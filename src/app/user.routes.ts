import {Routes} from '@angular/router';
import {UserNotificationsComponent} from './components/user/notifications.component';
import {UserMessagesComponent} from './components/user/messages.component';
import {UserProfileComponent} from './components/user/profile.component';
import {UserSettingsComponent} from './components/user/settings.component';
import {UserScoreComponent} from './components/user/score.component';
import {UserComponent} from './components/user/user.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'profile',
    pathMatch: 'full'
  },
  {path: 'notifications', component: UserNotificationsComponent},
  {path: 'messages', component: UserMessagesComponent},
  {path: 'profile', component: UserProfileComponent},
  {path: 'settings', component: UserSettingsComponent},
  {path: 'score', component: UserScoreComponent},
  {path: '/u/*', component: UserComponent}
];
