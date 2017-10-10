import {Routes} from '@angular/router';
import {UserNotificationsComponent} from './components/user/notifications.component';
import {UserMessagesComponent} from './components/user/messages.component';
import {UserProfileComponent} from './components/user/profile.component';
import {UserSettingsComponent} from './components/user/settings.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'profile',
    pathMatch: 'full'
  },
  {path: 'notifications', component: UserNotificationsComponent},
  {path: 'messages', component: UserMessagesComponent},
  {path: 'profile', component: UserProfileComponent},
  {path: 'settings', component: UserSettingsComponent}
];
