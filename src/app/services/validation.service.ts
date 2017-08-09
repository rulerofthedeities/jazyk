import {FormControl, FormGroup, AbstractControl} from '@angular/forms';
import {Http} from '@angular/http';
import {Observable} from 'rxjs/Observable';

export class ValidationService {

  static getValidatorErrorMessage(text: Object, field: string, validatorName: string, validatorValue?: any) {
    const length = validatorValue ? validatorValue.requiredLength : 0,
          required = text['isrequired'] ? text['isrequired'].replace('%s', text[field]) : '',
          minlength = text['minLength'] ? text['minLength'].replace('%s', text[field]).replace('%d', length) : '',
          invalidPassword = text['invalidPassword'] ? text['invalidPassword'].replace('%d', length) : '',
          config = {
      'required': required,
      'invalidEmailAddress': text['Invalidemail'],
      'minlength': minlength,
      'invalidPassword': invalidPassword,
      'invalidUserName': text['invalidUserName'],
      'usernameTaken': text['usernameTaken'],
      'emailTaken': text['emailTaken']
      };

    return config[validatorName];
  }

/*
  static equalPasswordsValidator(group: FormGroup): {[key: string]: any} {
    if (group.controls['password'].value === group.controls['confirmPassword'].value) {
      return null;
    } else {
      return {'mismatchingPasswords': true};
    }
  }

*/


  static userNameValidator(control: FormControl): {[key: string]: any} {
    if (control.value.match(/^[0-9a-zA-Z\.-éàèá]+$/) && control.value.toLowerCase()) {
      return null;
    } else {
      return {'invalidUserName': true};
    }
  }

  static emailValidator(control: FormControl): {[key: string]: any} {
    if (control.value.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/)) {
      return null;
    } else {
      return {'invalidEmailAddress': true};
    }
  }

  static passwordValidator(control: FormControl): {[key: string]: any} {
    if (control.value.match(/^(?=.*[0-9])[a-zA-Z0-9!@#$%^&*]{6,100}$/)) {
      return null;
    } else {
      return {'invalidPassword': {requiredLength: 6}};
    }
  }

  static checkUniqueUserName(http: Http) {
    return function(control) {
      console.log('checking unique username', control.value);
      return http
      .get('/api/user/check?user=' + control.value)
      .map(response => {
        if (response.json().obj === true) {
          return {'usernameTaken': true};
        } else {
          return null;
        }
      })
      .catch(error => Observable.throw(error.json()));
    };
  }

  static checkUniqueEmail(http: Http) {
    return function(control: AbstractControl) {
      return http
      .get('/api/user/check?mail=' + control.value)
      .map(response => {
        if (response.json().obj === true) {
          return {'emailTaken': true};
        } else {
          return null;
        }
      })
      .catch(error => Observable.throw(error.json()));
    };
  }
}


