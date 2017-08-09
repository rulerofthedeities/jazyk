import {Injectable, EventEmitter} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Error, UserError} from '../models/error.model';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class ErrorService {
  errorOccurred = new EventEmitter<Error>();

  constructor(
    private http: Http
  ) {}

  handleError(error: any) {
    let msg = 'unknown error message',
        title = 'error';
    if (error) {
      title = error.title || title;
      if (error.error) {
        msg = error.error.error || msg;
      }
    }
    this.errorOccurred.emit({title, msg});
  }

  clearError() {
    this.errorOccurred.emit({title: null, msg: null});
  }

  userError(error: UserError): string {
    switch (error.code) {
      case 'learn01':
        error.msg = this.getErrorMessage(error.code).replace(/%s/g, error.src);
        break;
    }
    this.logError(error).subscribe({ error: e => console.error(e) });
    return error.msg;
  }

  private getErrorMessage(errorCode: string): string {
    const lan = 'en';
    const messages = {
      jazyk00 : {
        'nl': 'Fout: Ongekende foutcode (' + errorCode + ')',
        'en': 'Error: Unknown error code (' + errorCode + ')',
        'fr': 'Erreur: Code d\'erreur inconnu (' + errorCode + ')'
      },
      learn01 : {
        'nl': 'Fout: De cursus met code "%s" kan niet gevonden worden',
        'en': 'Error: The course with code "%s" cannot be found',
        'fr': 'Erreur: Le cours avec le code "%s" ne peut être trouvé'
      }
    };
    let msg = 'unknown error';
    if (messages[errorCode]) {
      msg = messages[errorCode][lan] || messages[errorCode]['en'];
    } else if (messages['jazyk00'][lan]) {
      msg = messages['jazyk00'][lan] || messages['jazyk00']['en'];
    }
    return msg;
  }

  private logError(err: UserError) {
    console.log('logging', err);
    err.module = 'en';
    const headers = new Headers({'Content-Type': 'application/json'});
    return this.http
    .post('/api/error', JSON.stringify(err), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

}
