import { FormControl, FormGroup, FormArray, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

export class ValidationService {

  static getValidatorErrorMessage(
    text: Object,
    field: string,
    validatorName: string,
    validatorValue?: any) {
    const length = validatorValue && validatorValue.requiredLength || 0,
          lengthOk = validatorValue && validatorValue.lengthOk || false,
          required = text['isrequired'] ?
                      text['isrequired'].replace('%s', text[field]) : '',
          minlength = text['minLength'] ?
                      text['minLength'].replace('%s', text[field]).replace('%d', length) : '';
    let invalidPassword;
    if (lengthOk) {
      invalidPassword = text['invalidPasswordContent'];
    } else {
      invalidPassword = text['invalidPasswordLength'] ? text['invalidPasswordLength'].replace('%d', length) : '';
    }

    const config = {
            'required': required,
            'invalidEmailAddress': text['Invalidemail'],
            'minlength': minlength,
            'invalidPassword': invalidPassword,
            'invalidUserName': text['invalidUserName'],
            'invalidUserName2': text['invalidUserName2'],
            'usernameTaken': text['usernameTaken'],
            'emailTaken': text['emailTaken'],
            'noSelectOptions': text['noSelectOptions'],
            'invalidSelect': text['invalidSentence'],
            'invalidQAnswer': text['invalidQAnswer'],
            'invalidFillInSentence': text['invalidFillInSentence'],
            'matchingPasswords': text['equalPasswords']
           };
    return config[validatorName];
  }

  static userNameValidator(invalidNames: string[]): {[key: string]: any} {

    const isInvalidPattern = (value: string): boolean => {
      let regEx: RegExp;
      for (let i = 0; i < invalidNames.length; i++) {
        regEx = new RegExp(invalidNames[i]);
        if (value.match(regEx)) {
          return true;
        }
      }
      return false;
    };

    return function(control) {
      if (control.value.match(/^[0-9a-zA-Z\.-éàèá]+$/) && control.value.toLowerCase()) {
        if (isInvalidPattern(control.value)) {
          return {'invalidUserName2': true};
        } else {
          return null;
        }
      } else {
        return {'invalidUserName': true};
      }
    };
  }

  static emailValidator(control: FormControl): {[key: string]: any} {
    if (control.value.match(
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    )) {
      return null;
    } else {
      return {'invalidEmailAddress': true};
    }
  }

  static passwordValidator(control: FormControl): {[key: string]: any} {
    if (control.value.match(/^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})/)) {
      return null;
    } else {
      if (control.value.match(/(?=.{6,})/)) {
        return {'invalidPassword': {lengthOk: true}};
      } else {
        return {'invalidPassword': {requiredLength: 6}};
      }
    }
  }

  static checkUniqueUserName(http: HttpClient) {
    return function(control) {
      return http
      .get<boolean>('/api/user/check?user=' + control.value)
      .pipe(
        map(res => {
          if (res === true) {
            return {'usernameTaken': true};
          } else {
            return null;
          }
        })
      );
    };
  }

  static checkUniqueEmail(http: HttpClient) {
    return function(control: AbstractControl) {
      return http
      .get<boolean>('/api/user/check?mail=' + control.value)
      .pipe(
        map(res => {
          if (res === true) {
            return {'emailTaken': true};
          } else {
            return null;
          }
        })
      );
    };
  }

  static checkSelect(control: FormControl): {[key: string]: any} {
    if (control.value && control.value.match(/\[(.{1,}?)\]/)) {
      return null;
    } else {
      return {'invalidSelect': true};
    }
  }

  static checkSelectOptions(group: FormGroup): {[key: string]: any} {
    const options = <FormArray>group.controls['options'];
    if (options.controls.length > 0) {
      let value = '';
      options.controls.forEach(option => {
        if (option.value) {
          value += option.value.trim();
        }
      });
      if (value) {
        return null;
      } else {
        return {'noSelectOptions': true};
      }
    } else {
      return {'noSelectOptions': true};
    }
  }

  static checkQAnswer(control: FormControl): {[key: string]: any} {
    if (control.value && control.value.match(/\[(.{1,}?)\]/)) {
      return null;
    } else {
      return {'invalidQAnswer': true};
    }
  }

  static checkFillInSentence(control: FormControl): {[key: string]: any} {
    if (control.value && control.value.match(/\[(.{1,}?)\]/)) {
      return null;
    } else {
      return {'invalidFillInSentence': true};
    }
  }

  static equalPasswordsValidator(group: FormGroup): {[key: string]: any} {
    if (group.controls['oldPassword'].value === group.controls['newPassword'].value) {
      return {'matchingPasswords': true};
    } else {
      return null;
    }
  }
}
