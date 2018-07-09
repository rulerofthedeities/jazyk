import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {ErrorService} from '../../services/error.service';
import {Error} from '../../models/error.model';
import {takeWhile} from 'rxjs/operators';

@Component({
  selector: 'km-error-msg',
  template: `
    <div class="msg error more-transparant" *ngIf="msg">
      <span class="fa fa-exclamation-circle fa-spacing"></span>
      <span class="text">{{msg}}</span>
      <div class="error-detail">{{info}}</div>
    </div>`,
  styleUrls: ['msg.css']
})

export class ErrorMessageComponent implements OnInit, OnDestroy {
  @Input() msg: string;
  @Input() text: Object;
  @Input() info: string;
  private componentActive = true;

  constructor(
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getError();
  }

  private getError() {
    this.errorService
    .errorOccurred
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (errorData: Error) => {
        console.log('received error', errorData);
        if (errorData) {
          if (errorData.title) {
            const translatedMsg = this.text && this.text[errorData.title] ? this.text[errorData.title] : errorData.title;
            this.msg = translatedMsg;
          } else {
            this.msg = '';
          }
          this.info = errorData.msg || '';
        }
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
