import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {ValidationService} from '../../services/validation.service';
import {User} from '../../models/user.model';
import {config} from '../../app.config';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'sign-in.component.html',
  styleUrls: ['auth.component.css']
})

export class SignInComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private user: User;
  private isSubmitted = false;
  userForm: FormGroup;
  text: Object = {};

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private utilsService: UtilsService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getTranslations();
    this.buildForm();
  }

  getIconClass(fieldName: string): string {
    let className = '';

    if (this.userForm.controls[fieldName].touched || this.isSubmitted) {
      if (this.userForm.controls[fieldName].valid) {
        className = 'green';
      } else {
        className = 'red';
      }
    }

    return className;
  }

  onSubmitForm(user: User) {
    this.isSubmitted = true;
    if (this.userForm.valid) {
      this.authService
      .signin(user)
      .takeWhile(() => this.componentActive)
      .subscribe(
        data => this.authService.signedIn(data),
        error => this.errorService.handleError(error)
      );
    }
  }

  private buildForm() {
    this.userForm = this.formBuilder.group({
      'email': ['', [Validators.required, ValidationService.emailValidator]],
      'password': ['', Validators.required]
    });
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(config.language.slice(0, 2), 'AuthComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.utilsService.getTranslatedText(translations);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
