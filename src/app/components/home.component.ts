import {Component, OnInit, OnDestroy} from '@angular/core';
import {ErrorService} from '../services/error.service';
import {UtilsService} from '../services/utils.service';
import {config} from '../app.config';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.css']
})

export class HomeComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};

  constructor(
    private utilsService: UtilsService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getTranslations();
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(config.language.slice(0, 2), 'HomeComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.utilsService.getTranslatedText(translations);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
