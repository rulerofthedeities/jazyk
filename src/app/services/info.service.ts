import {Injectable, EventEmitter} from '@angular/core';
import {Http, Headers, URLSearchParams} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class InfoService {

  constructor(
    private http: Http
  ) {}

  fetchInfoPage(page: string, lan: string) {
    const filteredPage = page.replace(/\W/g, '');
    return this.http
    .get('/api/info/' + filteredPage + '/' + lan)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }
}
