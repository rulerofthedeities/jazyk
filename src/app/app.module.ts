import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {CoreModule} from './core.module';
import {RouterModule} from '@angular/router';
import {BrowserModule} from '@angular/platform-browser';

import {routes} from './app.routes';
import {UserResolver} from './resolves/user.resolver';

import {AppComponent} from './components/app.component';
import {MainMenuComponent} from './components/main-menu.component';
import {HomeComponent} from './components/home.component';

@NgModule({
  imports: [
    BrowserModule,
    SharedModule,
    RouterModule.forRoot(routes),
    CoreModule.forRoot()
  ],
  providers: [
    UserResolver
  ],
  declarations: [
    AppComponent,
    MainMenuComponent,
    HomeComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
