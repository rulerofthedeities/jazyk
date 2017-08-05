import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {UtilsService} from '../../services/utils.service';
import {ErrorService} from '../../services/error.service';
import {Error} from '../../models/error.model';
import {config} from '../../app.config';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-error-msg',
  template: `
    <div class="error" *ngIf="msg">
      <span class="fa fa-exclamation-circle"></span> {{msg}}
    </div>`,
  styles: [`
    .error {
      color: red;
      font-family: 'courier';
      font-size: 18px;
      margin: 20px 0;
    }
  `]
})

export class ErrorMessageComponent implements OnInit, OnDestroy {
  @Input() msg: string;
  private componentActive = true;
  text: Object = {};

  constructor(
    private utilsService: UtilsService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getTranslations();
    this.getError();
  }

  private getError() {
    this.errorService
    .errorOccurred
    .takeWhile(() => this.componentActive)
    .subscribe(
      (errorData: Error) => {
        if (errorData.msg) {
          this.msg = this.text['error'] + ': ' + this.text[errorData.msg];
        } else {
          this.msg = '';
        }
      }
    );
  }
  private getTranslations() {
    this.utilsService
    .fetchTranslations(config.language.slice(0, 2), 'ErrorComponent')
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
