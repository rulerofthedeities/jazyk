import { Component, OnDestroy, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { LogService } from '../services/log.service';
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
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private logService: LogService
  ) {}

  ngAfterViewInit() {
    this.setUpAnalytics();
  }

  private setUpAnalytics() {
    const GACode = environment.GACode;
    if (GACode && isPlatformBrowser(this.platformId)) {
      if (ga) {
        ga('create', GACode, 'auto');
      }
      this.router.events
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          if (ga) {
            ga('set', 'page', event.urlAfterRedirects);
            ga('send', 'pageview');
          }
          this.logService
          .logPage(event.urlAfterRedirects)
          .subscribe();
        }
      });
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
