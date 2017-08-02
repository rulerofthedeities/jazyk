import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {RouterModule} from '@angular/router';
import {BrowserModule} from '@angular/platform-browser';

import {routes} from './app.routes';

import {AppComponent} from './components/app.component';
import {MainMenuComponent} from './components/main-menu.component';
import {HomeComponent} from './components/home.component';
import {SignUpComponent} from './components/auth/sign-up.component';

@NgModule({
  imports: [
    BrowserModule,
    SharedModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
  ],
  declarations: [
    AppComponent,
    MainMenuComponent,
    HomeComponent,
    SignUpComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
