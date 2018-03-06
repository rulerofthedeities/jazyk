import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-info-msg',
  template: `
    <div class="msg info more-transparant" *ngIf="msg">
      <span class="fa fa-info-circle fa-spacing"></span>
      <span class="text">{{msg}}</span>
    </div>`,
  styleUrls: ['msg.css']
})

export class InfoMessageComponent {
  @Input() msg: string;
}
