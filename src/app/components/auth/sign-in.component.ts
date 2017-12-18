import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {SharedService} from '../../services/shared.service';
import {ValidationService} from '../../services/validation.service';
import {User} from '../../models/user.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'sign-in.component.html',
  styleUrls: ['auth.component.css']
})

export class SignInComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private user: User;
  isSubmitted = false;
  userForm: FormGroup;
  text: Object = {};

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private utilsService: UtilsService,
    private userService: UserService,
    private sharedService: SharedService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
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
    if (this.userForm.valid) {
      this.authService
      .signin(user)
      .takeWhile(() => this.componentActive)
      .subscribe(
        data => {
          this.authService.signedIn(data);
          this.userService.user = data.user;
          this.sharedService.userJustLoggedIn();
        },
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

  private getTranslations(lan: string) {
    this.utilsService
    .fetchTranslations(lan, 'AuthComponent')
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
