import {Injectable, EventEmitter} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Error, UserError} from '../models/error.model';
import {Observable} from 'rxjs/Observable';
import {config} from '../app.config';

@Injectable()
export class ErrorService {
  errorOccurred = new EventEmitter<Error>();

  constructor(
    private http: Http
  ) {}

  handleError(error: any) {
    console.log('error', error);
    let msg = 'unknown error message',
        err = 'unknown error',
        title = 'error';
    if (error._body) {
      error = JSON.parse(error._body);
    }
    if (error.error) {
      error = error.error;
    }
    if (error) {
      msg = error.message;
      err = error.error;
      title = error.title || 'Error';
    }
    this.errorOccurred.emit(new Error(title, msg, err));
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
    const lan = config.language;
    const messages = {
      jazyk00 : {
        'nl-nl': 'Fout: Ongekende foutcode (' + errorCode + ')',
        'en-en': 'Error: Unknown error code (' + errorCode + ')',
        'fr-fr': 'Erreur: Code d\'erreur inconnu (' + errorCode + ')'
      },
      learn01 : {
        'nl-nl': 'Fout: De cursus met code "%s" kan niet gevonden worden',
        'en-en': 'Error: The course with code "%s" cannot be found',
        'fr-fr': 'Erreur: Le cours avec le code "%s" ne peut être trouvé'
      }
    };
    let msg = 'unknown error';
    if (messages[errorCode]) {
      msg = messages[errorCode][lan] || messages[errorCode]['en-en'];
    } else if (messages['jazyk00'][lan]) {
      msg = messages['jazyk00'][lan] || messages['jazyk00']['en-en'];
    }
    return msg;
  }

  private logError(err: UserError) {
    console.log('logging', err);
    err.module = config.language;
    const headers = new Headers({'Content-Type': 'application/json'});
    return this.http
    .post('/api/error', JSON.stringify(err), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

}
