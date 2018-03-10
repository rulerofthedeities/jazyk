import {Injectable, EventEmitter} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Page} from '../models/info.model';
import {Observable} from 'rxjs/Observable';
import {retry} from 'rxjs/operators';

@Injectable()
export class InfoService {

  constructor(
    private http: HttpClient
  ) {}

  fetchInfoPage(page: string, lan: string): Observable<Page> {
    const filteredPage = page.replace(/\W/g, '');
    return this.http
    .get<Page>('/api/info/' + filteredPage + '/' + lan)
    .pipe(retry(3));
  }
}
