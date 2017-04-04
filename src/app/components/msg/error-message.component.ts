import {Component, OnInit} from '@angular/core';
import {Error} from '../../models/error.model';
import {ErrorService} from '../../services/error.service';

@Component({
  selector: 'km-error-msg',
  template: `
    <div *ngIf="showError">
      <h4>{{errorData.title}}</h4>
      <p>{{errorData.message}}</p>
      <div *ngIf="!detail" (click)="detail=true;">Show details</div>
      <p *ngIf="detail">
        {{errorData|json}}
      </p>
      <div *ngIf="detail" (click)="detail=false;">Hide details</div>
      <button type="button" (click)="onClose()">Close</button>
    </div>`
})

export class ErrorMessageComponent implements OnInit {
  errorData: Error;
  showError = false;

  constructor (private errorService: ErrorService) {}

  ngOnInit() {
    this.errorService.errorOccurred.subscribe(
      errorData => {
        this.errorData = errorData;
        this.showError = true;
      }
    );
  }

  onClose() {
    this.showError = false;
  }

}
