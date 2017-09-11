import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-info-msg',
  template: `
    <div class="info">
      <span class="fa fa-info-circle"></span>
      <span class="text">{{msg}}</span>
    </div>`,
  styles: [`
    .info {
      color: green;
      font-size: 20px;
      margin: 15px 0;
      background-color: rgba(255, 255, 255, .8);
      border-radius: 6px;
      padding: 15px;
    }
    .fa-info-circle {
      font-size: 36px;
      margin-right: 12px;
    }
    .text {
      display: inline-block;
      position: relative;
      top: -4px;
    }
  `]
})

export class InfoMessageComponent {
  @Input() msg: string;
}
