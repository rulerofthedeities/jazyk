import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {Error} from '../../models/error.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-error-msg',
  template: `
    <div class="msg error" *ngIf="msg">
      <span class="fa fa-exclamation-circle"></span>
      <span class="text">{{msg}}</span>
    </div>`,
  styleUrls: ['msg.css']
})

export class ErrorMessageComponent implements OnInit, OnDestroy {
  @Input() msg: string;
  private componentActive = true;
  text: Object = {};

  constructor(
    private utilsService: UtilsService,
    private errorService: ErrorService,
    private userService: UserService,
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
        console.log('ERROR', errorData);
        if (errorData.msg) {
          const translatedMsg = this.text[errorData.msg] ? this.text[errorData.msg] : errorData.msg;
          this.msg = translatedMsg;
        } else {
          this.msg = '';
        }
      }
    );
  }
  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.userService.user.lan, 'ErrorComponent')
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
