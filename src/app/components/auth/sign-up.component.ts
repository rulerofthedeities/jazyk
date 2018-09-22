import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UtilsService } from '../../services/utils.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { AuthService } from '../../services/auth.service';
import { ErrorService } from '../../services/error.service';
import { ValidationService } from '../../services/validation.service';
import { Language } from '../../models/main.model';
import { User } from '../../models/user.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  templateUrl: 'sign-up.component.html',
  styleUrls: ['auth.component.css']
})

export class SignUpComponent implements OnInit, OnDestroy {
  private componentActive = true;
  userForm: FormGroup;
  languages: Language[];
  text: Object = {};
  isReady = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private sharedService: SharedService,
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.getDependables();
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
    const learnLan = this.getDefaultLanguage();
    user.main = {
      lan: this.userService.user.main.lan,
      myLan: this.userService.user.main.myLan,
      background: true,
      gender: ''
    };
    user.jazyk = this.userService.getDefaultSettings(user.main.lan, false);
    user.grammator = {learnLan};
    user.vocabulator = {learnLan};
    if (this.userForm.valid) {
      this.authService
      .signup(user)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        data => this.signIn(user),
        error => this.errorService.handleError(error)
      );
    }
  }

  private signIn(user: User) {
    this.userService.clearUser();
    this.authService
    .signin(user)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      signInData => {
        signInData.returnUrl = '';
        this.authService.signedIn(signInData, false);
        this.userService.user = signInData.user;
        this.userService.fetchWelcomeNotification(signInData.user);
        this.log(`Logged in as ${signInData.user.userName}`);
        this.goToDashboard();
      },
      error => this.errorService.handleError(error)
    );
  }

  private buildForm() {
    this.userForm = this.formBuilder.group({
      'userName': ['', {
        validators: [Validators.required, ValidationService.userNameValidator],
        asyncValidators: [ValidationService.checkUniqueUserName(this.http)]
      }],
      'email': ['', {
        validators: [Validators.required, ValidationService.emailValidator],
        asyncValidators: [ValidationService.checkUniqueEmail(this.http)]
      }],
      'password': ['', {
        validators: [Validators.required, ValidationService.passwordValidator]
      }]
    });
  }

  private getDefaultLanguage(): string {
    const languages = this.languages.filter(language => language.active);
    let lan = '';
    if (languages.length > 0) {
      lan = languages[0].code;
    }
    return lan;
  }

  private getDependables() {
    const options = {
      lan: this.userService.user.main.lan,
      component: 'AuthComponent',
      getTranslations: true,
      getLanguages: true
    };
    this.utilsService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.text = this.utilsService.getTranslatedText(dependables.translations);
        this.languages = dependables.languages;
        this.utilsService.setPageTitle(this.text, 'Signup');
        this.isReady = true;
      },
      error => this.errorService.handleError(error)
    );
  }

  private goToDashboard() {
    this.router.navigateByUrl('/home');
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'SignUpComponent'
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
