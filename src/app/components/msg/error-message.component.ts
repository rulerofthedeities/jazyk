import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ErrorService } from '../../services/error.service';
import { Error } from '../../models/error.model';
import { takeWhile } from 'rxjs/operators';

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
    private errorService: ErrorService,
    private router: Router
  ) {}

  ngOnInit() {
    this.getError();
    this.getRoute();
  }

  private getError() {
    this.errorService
    .errorOccurred
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (errorData: Error) => {
        if (errorData) {
          if (errorData.title) {
            const translatedMsg = this.text && this.text[errorData.title] ? this.text[errorData.title] : errorData.title;
            this.msg = translatedMsg;
          } else {
            this.msg = '';
          }
          this.info = errorData.msg || '';
        } else {
          this.msg = null;
        }
      }
    );
  }

  private getRoute() {
    this.router
    .events
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.errorService.clearError();
      }
    });
  }


  ngOnDestroy() {
    this.componentActive = false;
  }
}
