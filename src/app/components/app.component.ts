import {Component} from '@angular/core';

@Component({
  selector: 'km-jazyk',
  template: `
  <img src="/assets/img/backgrounds/201708.jpg">
  <div class="container">
    <km-main-menu></km-main-menu>
    <router-outlet></router-outlet>
  </div>
  `,
  styleUrls: ['app.component.css']
})

export class AppComponent {}
