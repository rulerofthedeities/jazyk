import {Component} from '@angular/core';

@Component({
  selector: 'km-main-menu',
  template: `
    <nav class="clearfix">
      <ul class="nav navbar-nav">
        <li routerLinkActive="active">
          <a routerLink="learn" class="item">Leer</a>
        </li>
        <li routerLinkActive="active">
          <a routerLink="learn/courses" class="item">Cursussen</a>
        </li>
      </ul>
    </nav>
  `
})

export class MainMenuComponent {
  
}
