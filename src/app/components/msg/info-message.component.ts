import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-info-msg',
  template: `
    <div class="info">
      {{msg}}
    </div>`,
  styles: [`
    .info {
      color: green;
      font-size: 18px;
      margin: 20px 0;
    }
  `]
})

export class InfoMessageComponent {
  @Input() msg: string;
}
