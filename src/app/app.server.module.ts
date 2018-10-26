import { NgModule, Inject } from '@angular/core';
import { ServerModule, ServerTransferStateModule } from '@angular/platform-server';
import { ModuleMapLoaderModule } from '@nguniversal/module-map-ngfactory-loader';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import { CookieService } from 'ngx-cookie';
import { CookieBackendService } from './services/cookie-backend.service';

import { AppModule } from './app.module';
import { AppComponent } from './components/app.component';

@NgModule({
  imports: [
    // The AppServerModule should import your AppModule followed
    // by the ServerModule from @angular/platform-server.
    AppModule,
    ServerModule,
    ModuleMapLoaderModule, // <-- *Important* to have lazy-loaded routes work
    ServerTransferStateModule
  ],
  providers: [
    { provide: CookieService, useClass: CookieBackendService },
    { provide: 'request', useValue: REQUEST }
  ],
  // Since the bootstrapped component is not inherited from your
  // imported AppModule, it needs to be repeated here.
  bootstrap: [AppComponent]
})
export class AppServerModule {
  constructor(
    @Inject('request') private request: Request
  ) {
    // console.log('Request', this.request);
  }
}
