import {NgModule} from '@angular/core';
import {SharedModule} from './shared.module';
import {CoreModule} from './core.module';
import {RouterModule} from '@angular/router';
import {BrowserModule} from '@angular/platform-browser';

import {routes} from './app.routes';
import {UserResolver} from './resolves/user.resolver';

import {AppComponent} from './components/app.component';
import {BaseComponent} from './components/base.component';
import {MainMenuComponent} from './components/main-menu.component';
import {HomeComponent} from './components/home.component';
import {UserComponent} from './components/user/user.component';

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
    BaseComponent,
    MainMenuComponent,
    HomeComponent,
    UserComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
