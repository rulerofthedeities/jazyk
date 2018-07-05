import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {SharedService} from '../../services/shared.service';
import {ValidationService} from '../../services/validation.service';
import {User} from '../../models/user.model';
import {takeWhile} from 'rxjs/operators';

@Component({
  templateUrl: 'sign-in.component.html',
  styleUrls: ['auth.component.css']
})

export class SignInComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private returnUrl: string;
  isSubmitted = false;
  userForm: FormGroup;
  text: Object = {};
  referrerPath = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private utilsService: UtilsService,
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
    if (this.userForm.valid) {
      this.log('Logging in');
      this.authService
      .signin(user)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        data => {
          data.returnUrl = this.returnUrl;
          this.authService.signedIn(data);
          this.userService.user = data.user;
          this.sharedService.userJustLoggedIn();
          this.log(`Logged in as ${data.user.userName}`);
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  onKeyPressed(key: string, user: User) {
    if (key === 'Enter') {
      this.onSubmitForm(user);
    }
  }

  private buildForm() {
    this.userForm = this.formBuilder.group({
      'email': ['', [Validators.required, ValidationService.emailValidator]],
      'password': ['', Validators.required]
    });
  }

  private getTranslations(lan: string) {
    this.utilsService
    .fetchTranslations(lan, 'AuthComponent')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.utilsService.getTranslatedText(translations);
          this.utilsService.setPageTitle(this.text, 'Login');
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
