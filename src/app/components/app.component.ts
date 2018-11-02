import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { takeWhile } from 'rxjs/operators';
import { environment } from '../../environments/environment';
declare const ga: Function;
@Component({
  selector: 'km-jazyk',
  template: `<router-outlet></router-outlet>`
})

export class AppComponent implements OnInit, OnDestroy {
  private componentActive = true;

  constructor (
    private router: Router
  ) {}

  ngOnInit() {
    this.setUpAnalytics();
  }

  private setUpAnalytics() {
    const GACode = environment.GACode;
    if (GACode) {
      ga('create', GACode, 'auto');
      this.router.events
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          ga('set', 'page', event.urlAfterRedirects);
          ga('send', 'pageview');
        }
      });
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
