import {Injectable, EventEmitter} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Error, UserError} from '../models/error.model';
import {throwError} from 'rxjs';

@Injectable()
export class ErrorService {
  errorOccurred = new EventEmitter<Error>();

  constructor(
    private http: HttpClient
  ) {}

  handleError(error: any) {
    let msg = 'unknown error message',
        title = 'error';
    if (error.error) { // server side error
      console.error('error', error);
      title = error.error.title || error.title || title;
      msg = error.error.message || error.message;
      this.errorOccurred.emit({title, msg}); // Send info to error message component
      console.log('emitted error', {title, msg});
    }
    return throwError('Something bad happened; please try again later.');
  }

  clearError() {
    this.errorOccurred.emit(null);
  }

  userError(error: UserError): string {
    if (error) {
      switch (error.code) {
        case 'learn01':
          error.msg = this.getErrorMessage(error.code).replace(/%s/g, error.src);
          break;
      }
      this.logError(error).subscribe({ error: e => console.error(e) });
      return error.msg;
    }
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
        'nl': 'Fout: De cursus met id "%s" kan niet gevonden worden',
        'en': 'Error: The course with id "%s" cannot be found',
        'fr': 'Erreur: Le cours avec le id "%s" ne peut être trouvé'
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
    err.module = 'en';
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    return this.http
    .post('/api/error', JSON.stringify(err), {headers});
  }
}
