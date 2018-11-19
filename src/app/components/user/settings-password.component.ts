import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidationService } from '../../services/validation.service';
import { UserService } from '../../services/user.service';
import { ErrorService } from '../../services/error.service';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-user-settings-password',
  templateUrl: 'settings-password.component.html',
  styles: [`

  input.green {
    border: 1px solid green;
  }
  input.orange  {
    border: 1px solid orange;
  }
  input.red {
    border: 1px solid red;
  }
  `]
})

export class UserSettingsPasswordComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  private componentActive = true;
  pwForm: FormGroup;
  isFormReady = false;
  isUpdated = false;
  infoMsg = '';
  passwordColor: string;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.buildForm();
    this.observe();
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
      'oldPassword': ['', [Validators.required]],
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
        this.isUpdated = true;
        this.infoMsg = this.text['PasswordUpdated'];
        this.errorService.clearError();
        this.pwForm.patchValue({oldPassword: ''});
        this.pwForm.patchValue({newPassword: ''});
        this.pwForm.markAsUntouched();
      },
      error => this.errorService.handleError(error)
    );
  }

  private observe() {
    this.pwForm.get('newPassword').valueChanges.subscribe(pw => {
      this.passwordColor = this.getPasswordColor(pw);
    });
  }

  private getPasswordColor(pw: string): string {
    let color = 'red';
    const strength = this.userService.getPasswordStrength(pw);
    switch (strength) {
      case 'strong': color = 'green'; break;
      case 'medium': color = 'orange'; break;
    }
    return color;
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
