import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ErrorService } from '../../services/error.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { ValidationService } from '../../services/validation.service';
import { User, UserSignIn, MailData } from '../../models/user.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  templateUrl: 'sign-in.component.html',
  styleUrls: ['auth.component.css']
})

export class SignInComponent implements OnInit, OnDestroy {
  private componentActive = true;
  returnUrl: string;
  isSubmitted = false;
  userForm: FormGroup;
  text: Object = {};
  referrerPath = '';
  signInFailed = false;
  errMsg = '';
  forgotPassword = false;
  isForGotPasswordMailSent = false;
  addressForgotPassword: string;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private sharedService: SharedService,
    private errorService: ErrorService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.getReturnUrl();
    this.getTranslations(this.userService.user.main.lan);
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
    this.errorService.clearError();
    this.userService.clearUser();
    const signInUser: UserSignIn = {
      email: user.email,
      password: user.password
    };
    this.errMsg = '';
    if (this.userForm.valid) {
      this.log('Logging in');
      this.authService
      .signin(signInUser)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        data => {
          console.log('data login', data.user);
          data.returnUrl = this.returnUrl;
          this.authService.signedIn(data);
          this.userService.user = data.user;
          // this.sharedService.userJustLoggedIn();
          this.log(`Logged in as ${data.user.userName}`);
        },
        error => {
          if (error.status === 401) {
            this.signInFailed = true;
            this.errMsg = this.text['SignInFailed'];
          } else {
            this.errMsg = this.text['ErrorSigningIn'];
          }
        }
      );
    }
  }

  onKeyPressed(key: string, user: User) {
    if (key === 'Enter') {
      this.onSubmitForm(user);
    }
  }

  onForgotPassword() {
    this.forgotPassword = true;
    this.errMsg = '';
  }

  onCancelForgotPassword() {
    this.forgotPassword = false;
  }

  onSendForgotPasswordMail() {
    this.sendForgotPasswordMail();
  }

  private sendForgotPasswordMail() {
    this.addressForgotPassword = this.userForm.value['email'];
    const mailData: MailData = this.userService.getMailData(
      this.text,
      'forgotpassword',
      {
        email: this.userForm.value['email'],
        expireHours: 6
      }
    );
    this.userService
    .sendMailForgotPassword(mailData, this.userForm.value['email'])
    .pipe(takeWhile(() => !this.isForGotPasswordMailSent))
    .subscribe(result => {
      if (result) {
        this.isForGotPasswordMailSent = true;
      } else {
        // Pretend it was set for privacy/security reasons
        // Otherwise people can check if someone else is registered
        this.isForGotPasswordMailSent = true;
      }
    });
  }

  private buildForm() {
    this.userForm = this.formBuilder.group({
      'email': ['', {
        validators: [Validators.required, ValidationService.emailValidator]
      }],
      'password': ['', {
        validators: [Validators.required]
      }]
    });
  }

  private getTranslations(lan: string) {
    this.sharedService
    .fetchTranslations(lan, 'AuthComponent')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.sharedService.getTranslatedText(translations);
          this.sharedService.setPageTitle(this.text, 'Login');
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private getReturnUrl() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
    if (this.returnUrl.substr(0, 5) === '/auth') {
      this.returnUrl = '/home';
    }
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'SignInComponent'
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
