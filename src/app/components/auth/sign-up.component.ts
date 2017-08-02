import {Component, OnInit, OnDestroy} from '@angular/core';
import {UtilsService} from '../../services/utils.service';
import {ErrorService} from '../../services/error.service';
import {config} from '../../app.config';

@Component({
  templateUrl: 'sign-up.component.html',
  styleUrls: ['sign-up.component.css']
})

export class SignUpComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};

  constructor(
    private utilsService: UtilsService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getTranslations();
  }

  getTranslations() {
    this.utilsService
    .fetchTranslations(config.language.slice(0, 2), 'AuthComponent')
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
