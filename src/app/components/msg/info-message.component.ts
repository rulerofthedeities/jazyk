import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-info-msg',
  template: `
    <div class="msg info">
      <span class="fa fa-info-circle"></span>
      <span class="text">{{msg}}</span>
    </div>`,
  styleUrls: ['msg.css']
})

export class InfoMessageComponent {
  @Input() msg: string;
}
