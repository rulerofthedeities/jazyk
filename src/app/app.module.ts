import { NgModule } from '@angular/core';
import { CoreModule } from './core.module';
import { RouterModule, PreloadAllModules } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { TransferHttpCacheModule } from '@nguniversal/common';
import { ListModule } from './list.module';
import { CookieModule } from 'ngx-cookie';
import { ChartsModule } from 'ng2-charts';

import { routes } from './app.routes';
import { UserResolver } from './resolves/user.resolver';
import { ReadnListenService } from './services/readnlisten.service';
import { DashboardService } from './services/dashboard.service';
import { LogService } from './services/log.service';

import { AppComponent } from './components/app.component';
import { BaseComponent } from './components/base.component';
import { HomeComponent } from './components/home/home.component';
import { DefaultHomeComponent } from './components/home/default-home.component';
import { DashboardComponent } from './components/home/dashboard.component';
import { RecentStoryComponent } from './components/home/recent-story.component';
import { MainMenuComponent } from './components/main/main-menu.component';
import { AnnouncementComponent } from './components/main/announcement.component';
import { FooterComponent } from './components/main/footer.component';
import { LeaderboardComponent } from './components/main/leaderboard.component';
import { PageNotFoundComponent } from './components/main/not-found.component';

// Temp workaround for flickering in universal
import { PageService } from './services/page.service';
import { InfoComponent } from './components/pages/info.component';
import { ManualComponent } from './components/pages/manual.component';
import { BooklistComponent } from './components/pages/book-list.component';

@NgModule({
  imports: [
    BrowserModule.withServerTransition({appId: 'km-jazyk'}),
    HttpClientModule,
    RouterModule.forRoot(routes, {
      preloadingStrategy: PreloadAllModules,
      initialNavigation: 'enabled',
      scrollPositionRestoration: 'enabled'
    }),
    CoreModule.forRoot(),
    CookieModule.forRoot(),
    ListModule,
    ChartsModule,
    TransferHttpCacheModule
  ],
  providers: [
    UserResolver,
    ReadnListenService,
    DashboardService,
    PageService,
    LogService
  ],
  declarations: [
    AppComponent,
    BaseComponent,
    MainMenuComponent,
    AnnouncementComponent,
    FooterComponent,
    HomeComponent,
    DefaultHomeComponent,
    DashboardComponent,
    RecentStoryComponent,
    LeaderboardComponent,
    PageNotFoundComponent,
    InfoComponent,
    ManualComponent,
    BooklistComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
