import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-error-user-msg',
  template: `
    <div class="error">
      {{msg}}
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

export class ErrorMessageUserComponent {
  @Input() msg: string;
}
