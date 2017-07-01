import {Component, OnInit, OnDestroy} from '@angular/core';
import {UtilsService} from '../services/utils.service';
import {ErrorService} from '../services/error.service';
import {Translation} from '../models/course.model';
import {config} from '../app.config';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-main-menu',
  template: `
    <nav class="clearfix">
      <ul class="nav navbar-nav">
        <li routerLinkActive="active">
          <a routerLink="learn" class="item">{{text.Learn}}</a>
        </li>
        <li routerLinkActive="active">
          <a routerLink="learn/courses" class="item">{{text.Courses}}</a>
        </li>
      </ul>
    </nav>
  `
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
