import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {routes} from './app.routes';

import {AuthService} from './services/auth.service';
import {ValidationService} from './services/validation.service';

import {AppComponent} from './components/app.component';
import {MainMenuComponent} from './components/main-menu.component';
import {HomeComponent} from './components/home.component';
import {SignUpComponent} from './components/auth/sign-up.component';
import {FieldMessagesComponent} from './components/msg/field-messages.component';

@NgModule({
  imports: [
    BrowserModule,
    SharedModule,
    RouterModule.forRoot(routes),
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    AuthService,
    ValidationService
  ],
  declarations: [
    AppComponent,
    MainMenuComponent,
    HomeComponent,
    SignUpComponent,
    FieldMessagesComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
