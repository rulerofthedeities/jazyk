import {Injectable, EventEmitter} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Page} from '../models/page.model';
import {Observable} from 'rxjs';
import {retry} from 'rxjs/operators';

@Injectable()
export class PageService {

  constructor(
    private http: HttpClient
  ) {}

  fetchInfoPage(page: string, lan: string): Observable<Page> {
    const filteredPage = page.replace(/\W/g, '');

    console.log('page', '/api/pages/info/' + filteredPage + '/' + lan);
    return this.http
    .get<Page>('/api/pages/info/' + filteredPage + '/' + lan)
    .pipe(retry(3));
  }
}
