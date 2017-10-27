import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {routes} from './user.routes';

import {ValidationService} from './services/validation.service';

import {UserNotificationsComponent} from './components/user/notifications.component';
import {UserMessagesComponent} from './components/user/messages.component';
import {UserProfileComponent} from './components/user/profile.component';
import {UserSettingsComponent} from './components/user/settings.component';
import {UserSettingsMainComponent} from './components/user/settings-main.component';
import {UserSettingsLearnComponent} from './components/user/settings-learn.component';
import {UserSettingsPasswordComponent} from './components/user/settings-password.component';
import {UserSelectorComponent} from './components/fields/user-selector.component';
import {ToggleComponent} from './components/fields/toggle.component';

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    ValidationService
  ],
  declarations: [
    UserNotificationsComponent,
    UserMessagesComponent,
    UserProfileComponent,
    UserSettingsComponent,
    UserSettingsMainComponent,
    UserSettingsLearnComponent,
    UserSettingsPasswordComponent,
    UserSelectorComponent,
    ToggleComponent
  ]
})
export class UserModule {}
