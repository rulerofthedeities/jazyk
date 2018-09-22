import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { LogService } from '../services/log.service';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-jazyk',
  template: `<router-outlet></router-outlet>`
})

export class AppComponent implements OnInit, OnDestroy {
  private componentActive = true;

  constructor(
    private router: Router,
    private logService: LogService
  ) {}

  ngOnInit() {
    this.logPages();
  }

  private logPages() {
    this.router.events
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.logService
        .logPage(event.url)
        .subscribe();
      }
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
