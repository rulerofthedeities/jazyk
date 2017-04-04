import {Component} from '@angular/core';

@Component({
  selector: 'km-main-menu',
  template: `
    <nav class="clearfix">
      <ul class="nav navbar-nav">
        <li routerLinkActive="active">
          <a routerLink="home" class="item">Home</a>
        </li>
        <li routerLinkActive="active">
          <a routerLink="build" class="item">Build</a>
        </li>
      </ul>
    </nav>
  `
})

export class MainMenuComponent {
  
}
