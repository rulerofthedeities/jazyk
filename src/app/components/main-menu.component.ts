import {Component, OnInit, OnDestroy} from '@angular/core';
import {UtilsService} from '../services/utils.service';
import {ErrorService} from '../services/error.service';
import {Translation} from '../models/course.model';
import {config} from '../app.config';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-main-menu',
  templateUrl: 'main-menu.component.html',
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
    }
    .login {
      margin-right: 15px;
    }
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
