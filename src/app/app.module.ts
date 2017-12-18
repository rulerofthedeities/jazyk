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
import {FooterComponent} from './components/footer.component';
import {HomeComponent} from './components/home.component';
import {PageNotFoundComponent} from './components/not-found.component';

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
    FooterComponent,
    HomeComponent,
    PageNotFoundComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
