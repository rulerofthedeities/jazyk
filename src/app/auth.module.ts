import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {routes} from './auth.routes';

import {AuthService} from './services/auth.service';
import {ValidationService} from './services/validation.service';

import {SignUpComponent} from './components/auth/sign-up.component';
import {SignInComponent} from './components/auth/sign-in.component';
import {FieldMessagesComponent} from './components/msg/field-messages.component';

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    AuthService,
    ValidationService
  ],
  declarations: [
    SignUpComponent,
    SignInComponent,
    FieldMessagesComponent
  ]
})
export class AuthModule {}
