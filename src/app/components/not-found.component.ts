import {Component} from '@angular/core';
import {Router, NavigationEnd} from '@angular/router';
import {filter} from 'rxjs/operators';

@Component({
  template: `
    <km-error-msg *ngIf="showError"
      [msg]="msg"
      [info]="previousPath"
    ></km-error-msg>`
})

export class PageNotFoundComponent {
  msg = '404 Page not found';
  previousPath = '';
  showError = false;

  constructor (
    private router: Router
  ) {
    router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe((nav: NavigationEnd) => {
      this.previousPath = nav.url;
      this.showError = true;
    });
  }
}
