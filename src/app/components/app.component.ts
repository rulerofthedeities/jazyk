import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'km-jazyk',
  template: `
  <img src="/assets/img/backgrounds/{{this.month}}.jpg">
  <div class="container">
    <km-main-menu></km-main-menu>
    <router-outlet></router-outlet>
  </div>
  `,
  styleUrls: ['app.component.css']
})

export class AppComponent implements OnInit {
  month: string;

  ngOnInit() {
    this.setBackgroundMonth();
  }

  private setBackgroundMonth() {
    const dt = new Date();
    const y = dt.getFullYear();
    const m = ('0' + (dt.getMonth() + 1)).slice(-2);
    this.month = y + m;
  }
}
