import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {routes} from './auth.routes';

import {ValidationService} from './services/validation.service';

import {SignUpComponent} from './components/auth/sign-up.component';
import {SignInComponent} from './components/auth/sign-in.component';

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
    SignUpComponent,
    SignInComponent
  ]
})
export class AuthModule {}
