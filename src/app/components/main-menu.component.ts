import {Component, OnInit, OnDestroy} from '@angular/core';
import {UtilsService} from '../services/utils.service';
import {ErrorService} from '../services/error.service';
import {Translation} from '../models/course.model';
import {config} from '../app.config';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-main-menu',
  template: `
    <nav class="navbar navbar-earthy navbar-fixed-top">
      <div class="container">
        <!-- Brand and toggle get grouped for better mobile display -->
        <div class="navbar-header">
            <button type="button" data-target="#navbarCollapse" data-toggle="collapse" class="navbar-toggle">
                <span class="sr-only">Toggle navigation</span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
            </button>
            <a routerLink="" class="logo">
              <img src="/assets/img/logobadge.png">
            </a>
        </div>
        <!-- Collection of nav links and other content for toggling -->
        <div id="navbarCollapse" class="collapse navbar-collapse">
            <ul class="nav navbar-nav">
              <li routerLinkActive="active">
                <a routerLink="learn" class="item">
                  <span class="fa fa-book"></span>
                  {{text["Learn"]}}
                 </a>
              </li>
              <li routerLinkActive="active">
                <a routerLink="learn/courses" class="item">
                  <span class="fa fa-th-list"></span>
                  {{text["Courses"]}}
                </a>
              </li>
            </ul>
            <ul class="nav navbar-nav navbar-right">
                <li><a href="#">Login</a></li>
            </ul>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .logo img {
      margin: 2px 10px;
    }
    .navbar-earthy {
      background: #41474b;
      background: linear-gradient(0deg, #2c3033, #41474b, #41474b);
      color: #ddd;
      font-size: 24px;
    }
    .navbar-earthy a {
      color: #ddd;
    }
    .navbar-earthy .nav > li > a:hover, .nav > li > a:focus {
      color: black;
    }
    nav {
      box-shadow: 0px 4px 6px rgba(20, 20, 20, 0.3);
    };
  `]
})

export class MainMenuComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};

  constructor(
    private utilsService: UtilsService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getTranslations();
  }

  private setText(translations: Translation[]) {
    this.text = this.utilsService.getTranslatedText(translations);
  }

  private getTranslations() {
    const lan = config.language.slice(0, 2);
    this.utilsService
    .fetchTranslations(lan, 'MainMenuComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => this.setText(translations),
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
