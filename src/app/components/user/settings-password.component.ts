import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ValidationService} from '../../services/validation.service';

@Component({
  selector: 'km-user-settings-password',
  templateUrl: 'settings-password.component.html'
})

export class UserSettingsPasswordComponent implements OnInit {
  pwForm: FormGroup;
  isFormReady = false;
  @Input() text: Object;

  constructor(
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.buildForm();
  }

  onChangePassword(form: any) {
    if (form.valid) {
      console.log('updating password', form.value);
    }
  }

  private buildForm() {
    this.pwForm = this.formBuilder.group({
      'oldPassword': ['', [Validators.required, ValidationService.passwordValidator]],
      'newPassword': ['', [Validators.required, ValidationService.passwordValidator]]
    }, {validator: ValidationService.equalPasswordsValidator});
    this.isFormReady = true;
  }
}
