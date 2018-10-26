import { Inject, Injectable, Injector } from '@angular/core';

import { CookieService } from 'ngx-cookie';
import { CookieOptionsProvider } from 'ngx-cookie';

import { REQUEST, RESPONSE } from '@nguniversal/express-engine/tokens';

/*Change Inject 'REQUEST' per REQUEST and 'RESPONSE' per RESPONSE*/

@Injectable()
export class CookieBackendService extends CookieService {

  constructor(
    private injector: Injector,
    // @Inject(REQUEST) private request: any,
    // @Inject(RESPONSE) private response: any,
    _optionsProvider: CookieOptionsProvider
  ) {
    super(_optionsProvider);
  }

  protected get cookieString(): string {
    return this.injector.get(REQUEST).headers.cookie || '';
  }

  protected set cookieString(val: string) {
    this.injector.get(REQUEST).headers.cookie = val;
    this.injector.get(RESPONSE).headers.cookie = val;
  }
}
