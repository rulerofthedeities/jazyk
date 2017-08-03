import {FormControl, FormGroup, AbstractControl} from '@angular/forms';
import {Http} from '@angular/http';
import {Observable} from 'rxjs/Observable';

export class ValidationService {

  static getValidatorErrorMessage(label: string, validatorName: string, validatorValue?: any) {
    const config = {
      'required': label + ' is verplicht',
      'invalidEmailAddress': 'Incorrect email adres. Het juiste formaat is jan@peeters.com.',
      'minlength': `${label} moet minstens ${validatorValue.requiredLength} karakters lang zijn.`,
      'invalidPassword': `Ongeldig wachtwoord. Het wachtwoord moet minstens ${validatorValue.requiredLength}`
      + ` karakters lang zijn en een cijfer bevatten.`,
      'invalidUserName': 'Incorrecte gebruikernaam. Enkel karakters en cijfers zijn toegestaan.',
      'usernameTaken': `Deze gebruikersnaam is niet beschikbaar. Gelieve een andere gebruikersnaam te kiezen.`,
      'emailTaken': `Dit email adres is niet beschikbaar. Gelieve een ander email te gebruiken.`
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
    if (control.value.match(/^[0-9a-zA-Z\.-]+$/)) {
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


