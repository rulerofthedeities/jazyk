import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {AuthService } from '../../services/auth.service';
import {ErrorService} from '../../services/error.service';
import {ValidationService} from '../../services/validation.service';
import {Language} from '../../models/course.model';
import {User, Notification} from '../../models/user.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'sign-up.component.html',
  styleUrls: ['auth.component.css']
})

export class SignUpComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private user: User;
  userForm: FormGroup;
  languages: Language[];
  text: Object = {};
  isReady = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService,
    private http: HttpClient
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
      background: true,
      gender: ''
    };
    user.jazyk = this.userService.getDefaultSettings(user.main.lan, false);
    user.grammator = {learnLan};
    user.vocabulator = {learnLan};
    if (this.userForm.valid) {
      this.authService
      .signup(user)
      .takeWhile(() => this.componentActive)
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
    .takeWhile(() => this.componentActive)
    .subscribe(
      signInData => {
        this.authService.signedIn(signInData);
        this.userService.user = signInData.user;
        this.userService.fetchWelcomeNotification(signInData.user);
      },
      error => this.errorService.handleError(error)
    );
  }

  private buildForm() {
    this.userForm = this.formBuilder.group({
      'userName': ['', [
        Validators.required,
        ValidationService.userNameValidator],
        ValidationService.checkUniqueUserName(this.http)],
      'email': ['', [
        Validators.required,
        ValidationService.emailValidator],
        ValidationService.checkUniqueEmail(this.http)],
      'password': ['', [
        Validators.required,
        ValidationService.passwordValidator]]
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
    .takeWhile(() => this.componentActive)
    .subscribe(
      dependables => {
        this.text = this.utilsService.getTranslatedText(dependables.translations);
        this.languages = dependables.languages;
        this.isReady = true;
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
