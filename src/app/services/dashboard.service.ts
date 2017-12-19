import {Injectable} from '@angular/core';
import {Http, Headers, URLSearchParams} from '@angular/http';
import {AuthService} from './auth.service';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class DashboardService {

  constructor(
    private http: Http,
    private authService: AuthService
  ) {}

  fetchCounts() {
    const headers = this.getTokenHeaders();
    return this.http
    .get('/api/dashboard/count', {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  /*** Common ***/

  private getTokenHeaders(): Headers {
    const token = this.authService.getToken(),
          headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    return headers;
  }
}
