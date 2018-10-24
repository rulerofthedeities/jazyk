import { NgModule } from '@angular/core';
import { CoreModule } from './core.module';
import { RouterModule } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { TransferHttpCacheModule } from '@nguniversal/common';
import { SharedModule } from './shared.module';
import { CookieModule } from 'ngx-cookie';

import { routes } from './app.routes';
import { UserResolver } from './resolves/user.resolver';
import { ReadnListenService } from './services/readnlisten.service';
import { DashboardService } from './services/dashboard.service';

import { AppComponent } from './components/app.component';
import { BaseComponent } from './components/base.component';
import { MainMenuComponent } from './components/main-menu.component';
import { FooterComponent } from './components/footer.component';
import { HomeComponent } from './components/home/home.component';
import { DefaultHomeComponent } from './components/home/default-home.component';
import { DashboardComponent } from './components/home/dashboard.component';
import { PageNotFoundComponent } from './components/not-found.component';

@NgModule({
  imports: [
    BrowserModule.withServerTransition({appId: 'km-jazyk'}),
    SharedModule,
    RouterModule.forRoot(routes),
    CoreModule.forRoot(),
    CookieModule.forRoot(),
    TransferHttpCacheModule
  ],
  providers: [
    UserResolver,
    ReadnListenService,
    DashboardService
  ],
  declarations: [
    AppComponent,
    BaseComponent,
    MainMenuComponent,
    FooterComponent,
    HomeComponent,
    DefaultHomeComponent,
    DashboardComponent,
    PageNotFoundComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
