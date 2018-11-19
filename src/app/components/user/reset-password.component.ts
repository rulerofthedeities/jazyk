import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { SharedService } from '../../services/shared.service';
import { ValidationService } from '../../services/validation.service';
import { UserSignIn } from 'app/models/user.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  templateUrl: 'reset-password.component.html',
  styleUrls: ['user.css', 'reset-password.component.css']
})

export class ResetPasswordComponent implements OnInit, OnDestroy {
  private componentActive = true;
  pwForm: FormGroup;
  text: Object;
  errorMsg: string;
  infoMsg: string;
  passwordColor: string;
  resetIdValid = false;
  isReady = false;
  isError = false;
  isLoggingIn = false;
  resetId: string;
  email: string;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private userService: UserService,
    private authService: AuthService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.getTranslations(this.userService.user.main.lan);
    this.buildForm();
  }

  onSubmitForm(pw: {password: string}) {
    if (this.pwForm.valid) {
      this.userService
      .resetPw(pw.password, this.email, this.resetId)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        verified => {
          verified = verified.toString();
          if (verified === '0') {
            this.signIn({password: pw.password, email: this.email});
          } else {
            this.isError = true;
            switch (verified) {
              case '1': this.errorMsg = this.text['ErrorMailResetId2']; break; // reset id incorrect
              case '2': this.errorMsg = this.text['ErrorMailResetId1']; break; // reset id / mail combo incorrect
              case '3': this.errorMsg = this.text['ErrorMailResetId3']; break; // reset id expired
              default: this.errorMsg = this.text['ErrorPwReset'];
            }
          }
        },
        error => {
          this.isError = false;
          this.errorMsg = this.text['ErrorMailResetId'] + ' - ' + error.message;
        }
      );
    }
  }

  private signIn(signInUser: UserSignIn) {
    this.isLoggingIn = true;
    this.authService
    .signin(signInUser)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      data => {
        this.authService.signedIn(data);
        this.userService.user = data.user;
        this.sharedService.userJustLoggedIn();
        this.log(`Logged in as ${data.user.userName}`);
        this.isLoggingIn = false;
      },
      error => {
        this.isLoggingIn = false;
        if (error.status === 401) {
          this.errorMsg = this.text['SignInFailed'];
        } else {
          this.errorMsg = this.text['ErrorSigningIn'];
        }
      }
    );
  }

  private buildForm() {
    this.pwForm = this.formBuilder.group({
      'password': ['', {
        validators: [Validators.required, ValidationService.passwordValidator]
      }]
    });
    this.observe();
    this.isReady = true;
  }

  private checkResetId(resetId: string, email: string) {
    this.userService
    .checkResetId(resetId, email)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      verified => {
        verified = verified.toString();
        if (verified === '0') {
          this.infoMsg = '';
          this.errorMsg = '';
          this.resetIdValid = true;
        } else {
          switch (verified) {
            case '1': this.errorMsg = this.text['ErrorMailResetId1']; break; // email not found
            case '2': this.errorMsg = this.text['ErrorMailResetId2']; break; // reset id incorrect
            case '3': this.errorMsg = this.text['ErrorMailResetId3']; break; // reset id expired
            default: this.errorMsg = this.text['ErrorMailResetId'];
          }
        }
      },
      error => {
        this.errorMsg = this.text['ErrorMailResetId'] + ' - ' + error.message;
      }
    );
  }

  private getTranslations(lan: string) {
    this.sharedService
    .fetchTranslations(lan, 'AuthComponent')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.sharedService.getTranslatedText(translations);
          this.sharedService.setPageTitle(this.text, 'PasswordReset');
          this.getQueryParams();
        }
      }
    );
  }

  private getQueryParams() {
    this.route.queryParams
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      params => {
        if (params['resetId']) {
          this.email = params['email'];
          this.resetId = params['resetId'];
          this.checkResetId(this.resetId, this.email);
        } else {
          this.errorMsg = 'Error: No reset Id found';
        }
      }
    );
  }

  private observe() {
    this.pwForm.get('password').valueChanges.subscribe(pw => {
      this.passwordColor = this.userService.getPasswordColor(pw);
    });
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'ResetPasswordComponent'
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
