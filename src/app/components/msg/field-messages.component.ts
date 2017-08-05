import {Component, Input} from '@angular/core';
import {FormControl} from '@angular/forms';
import {ValidationService} from '../../services/validation.service';

@Component({
  selector: 'km-field-messages',
  template: `
    <div class="text-danger" *ngIf="errorMessage !== null">
      {{errorMessage}}
    </div>`,
  styles: [`
    :host {
      display:block;
      min-height: 42px;
    }
  `]
})
export class FieldMessagesComponent {
  @Input() control: FormControl;
  @Input() label = 'Field';
  @Input() text: Object;
  @Input() touchRequired = true;

  get errorMessage(): string {
    for (const propertyName in this.control.errors) {
      if (this.control.errors.hasOwnProperty(propertyName) && (this.control.touched || !this.touchRequired)) {
        const msg = ValidationService.getValidatorErrorMessage(this.text, this.label, propertyName, this.control.errors[propertyName]);
        return msg;
      }
    }
    return null;
  }
}
