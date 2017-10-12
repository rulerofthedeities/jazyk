import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Http} from '@angular/http';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {AuthService } from '../../services/auth.service';
import {ErrorService} from '../../services/error.service';
import {ValidationService} from '../../services/validation.service';
import {User} from '../../models/user.model';

@Component({
  templateUrl: 'sign-up.component.html',
  styleUrls: ['auth.component.css']
})

export class SignUpComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private user: User;
  userForm: FormGroup;
  text: Object = {};

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService,
    private http: Http
  ) {}

  ngOnInit() {
    this.getTranslations();
    this.buildForm();
  }

  getIconClass(fieldName: string): string {
    let className = '';

    if (this.userForm.controls[fieldName].touched) {
      if (this.userForm.controls[fieldName].valid) {
        className = 'green';
      } else {
        className = 'red';
      }
    }

    return className;
  }

  onSubmitForm(user: User) {
    const learnLan = this.utilsService.getDefaultLanguage();
    user.lan = this.userService.user.lan;
    user.jazyk = this.userService.getDefaultSettings();
    user.grammator = {learnLan};
    user.vocabulator = {learnLan};
    if (this.userForm.valid) {
      this.authService
      .signup(user)
      .takeWhile(() => this.componentActive)
      .subscribe(
        data => {
          this.authService
          .signin(user)
          .takeWhile(() => this.componentActive)
          .subscribe(
            signInData => {
              this.authService.signedIn(signInData);
              this.userService.user = signInData.user;
            },
            error => this.errorService.handleError(error)
          );
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  private buildForm() {
    this.userForm = this.formBuilder.group({
      'userName': ['', [Validators.required, ValidationService.userNameValidator], ValidationService.checkUniqueUserName(this.http)],
      'email': ['', [Validators.required, ValidationService.emailValidator], ValidationService.checkUniqueEmail(this.http)],
      'password': ['', [Validators.required, ValidationService.passwordValidator]]
    });
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.userService.user.lan, 'AuthComponent')
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
