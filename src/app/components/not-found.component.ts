import {Component} from '@angular/core';

@Component({
  template: `<km-error-msg [msg]="msg"></km-error-msg>`
})

export class PageNotFoundComponent {
  msg = '404 Page not found';
}
