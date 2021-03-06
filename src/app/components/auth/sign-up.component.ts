import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { AuthService } from '../../services/auth.service';
import { ErrorService } from '../../services/error.service';
import { ValidationService } from '../../services/validation.service';
import { PlatformService } from '../../services/platform.service';
import { Language } from '../../models/main.model';
import { User, UserSignIn, MailData } from '../../models/user.model';
import { BehaviorSubject } from 'rxjs';
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
  bookLanguage: Language;
  bookLanguages: Language[];
  isVerificationMailSent = false;
  passwordColor: string;
  invalidNames: string[] = [];
  isBrowser = false;
  bookLanguageChanged: BehaviorSubject<Language>;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private sharedService: SharedService,
    private userService: UserService,
    private errorService: ErrorService,
    private platform: PlatformService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.isBrowser = this.platform.isBrowser;
    this.getDependables();
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

  onKeyPressed(key: string, user: User) {
    if (key === 'Enter') {
      this.onSubmitForm(user);
    }
  }

  onBookLanguageSelected(lan: Language) {
    this.bookLanguage = lan;
  }

  onSubmitForm(user: User) {
    user.main = {
      lan: this.userService.user.main.lan,
      myLan: this.userService.user.main.myLan,
      background: true,
      gender: ''
    };
    user.jazyk = this.userService.getDefaultSettings(this.bookLanguage.code, false);
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
    const signInUser: UserSignIn = {
      email: user.email,
      password: user.password
    };
    this.authService
    .signin(signInUser)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      signInData => {
        signInData.returnUrl = '';
        this.authService.signedIn(signInData, false);
        this.userService.user = signInData.user;
        this.userService.fetchWelcomeMessage(signInData.user);
        this.sendVerificationMail();
        this.log(`Logged in as ${signInData.user.userName}`);
        this.goToDashboard();
      },
      error => this.errorService.handleError(error)
    );
  }

  private buildForm() {
    this.userForm = this.formBuilder.group({
      'userName': ['', {
        validators: [Validators.required, ValidationService.userNameValidator(this.invalidNames)],
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

  private getDependables() {
    const options = {
      lan: this.userService.user.main.lan,
      component: 'AuthComponent',
      getTranslations: true,
      getLanguages: true,
      getInvalidNames: true
    };
    this.sharedService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.text = this.sharedService.getTranslatedText(dependables.translations);
        this.languages = dependables.languages;
        this.bookLanguages = dependables.bookLanguages;
        this.bookLanguage = this.setDefaultBookLanguage(this.bookLanguages);
        this.bookLanguageChanged = new BehaviorSubject(this.bookLanguage);
        this.invalidNames = dependables.invalidNames ? dependables.invalidNames.split('|') : [];
        this.sharedService.setPageTitle(this.text, 'Signup');
        this.buildForm();
        this.observe();
        this.isReady = true;
      },
      error => this.errorService.handleError(error)
    );
  }

  private setDefaultBookLanguage(languages: Language[]): Language {
    // Default language is French unless the interface lan is French, then it is German
    const defaultLancode = this.userService.user.main.lan !== 'fr' ? 'fr' : 'de',
          defaultLan = languages.find(l => l.code === defaultLancode);
    if (defaultLan) {
      return defaultLan;
    } else {
      return languages[0];
    }
  }

  private sendVerificationMail() {
    const mailData: MailData = this.userService.getMailData(
      this.text,
      'verification',
      {userName: this.userService.user.userName, isNewUser: true}
    );
    this.userService
    .sendMailVerification(mailData)
    .pipe(takeWhile(() => !this.isVerificationMailSent))
    .subscribe(result => {
      this.isVerificationMailSent = true;
    });
  }

  private goToDashboard() {
    this.router.navigateByUrl('/home');
  }

  private observe() {
    this.userForm.get('password').valueChanges.subscribe(pw => {
      this.passwordColor = this.userService.getPasswordColor(pw);
    });
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
