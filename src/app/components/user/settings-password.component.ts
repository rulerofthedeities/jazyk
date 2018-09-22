import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidationService } from '../../services/validation.service';
import { UserService } from '../../services/user.service';
import { ErrorService } from '../../services/error.service';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-user-settings-password',
  templateUrl: 'settings-password.component.html'
})

export class UserSettingsPasswordComponent implements OnInit, OnDestroy {
  private componentActive = true;
  pwForm: FormGroup;
  isFormReady = false;
  infoMsg = '';
  @Input() text: Object;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.buildForm();
  }

  onChangeField() {
    this.errorService.clearError();
  }

  onChangePassword(form: any) {
    if (form.valid) {
      this.updatePassword(form.value);
    }
  }

  private buildForm() {
    this.pwForm = this.formBuilder.group({
      'oldPassword': ['', [Validators.required, ValidationService.passwordValidator]],
      'newPassword': ['', [Validators.required, ValidationService.passwordValidator]]
    }, {validator: ValidationService.equalPasswordsValidator});
    this.isFormReady = true;
  }

  private updatePassword(passwords: any) {
    this.userService
    .updatePassword(passwords.oldPassword, passwords.newPassword)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        this.infoMsg = this.text['PasswordUpdated'];
        this.errorService.clearError();
        this.pwForm.patchValue({oldPassword: ''});
        this.pwForm.patchValue({newPassword: ''});
        this.pwForm.markAsUntouched();
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
