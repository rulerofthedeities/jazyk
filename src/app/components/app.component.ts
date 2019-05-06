import { Component, OnDestroy, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { PlatformService } from '../services/platform.service';
import { takeWhile } from 'rxjs/operators';
import { environment } from '../../environments/environment';
declare const ga: Function;

@Component({
  selector: 'km-jazyk',
  template: `<router-outlet></router-outlet>`
})

export class AppComponent implements AfterViewInit, OnDestroy {
  private componentActive = true;

  constructor (
    private platform: PlatformService,
    private router: Router
  ) {}

  ngAfterViewInit() {
    this.setUpAnalytics();
  }

  private setUpAnalytics() {
    const GACode = environment.GACode;
    if (GACode && this.platform.isBrowser) {
      if (ga) {
        ga('create', GACode, 'auto');
        // log initial entry page
        ga('send', 'pageview', this.router.url);
      }
      this.router.events
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          if (ga) {
            ga('set', 'page', event.urlAfterRedirects);
            ga('send', 'pageview');
          }
        }
      });
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
