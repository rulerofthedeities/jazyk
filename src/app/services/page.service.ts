import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Page, BooksByLan, ManualIndex } from '../models/page.model';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';

@Injectable()
export class PageService {

  constructor(
    private http: HttpClient,
    @Optional() @Inject('ORIGIN_URL') private originUrl: string
  ) {}

  fetchInfoPage(page: string, lan: string, loggedIn: boolean): Observable<Page> {
    const filteredPage = page.replace(/\W/g, ''),
          hostName = this.originUrl || '', // for ssr
          url = hostName + '/api/pages/info/' + filteredPage + '/' + lan + '/' + loggedIn.toString();
    return this.http
    .get<Page>(url)
    .pipe(retry(3));
  }

  getBookList(tpe: string): Observable<BooksByLan[]> {
    const hostName = this.originUrl || ''; // for ssr
    return this.http
    .get<BooksByLan[]>(hostName + '/api/pages/booklist/' + tpe)
    .pipe(retry(3));
  }

  /*** MANUAL ***/
  fetchManualIndex(): Observable<ManualIndex[]> {
    const hostName = this.originUrl || ''; // for ssr
    return this.http
    .get<ManualIndex[]>(hostName + '/api/pages/manual/index')
    .pipe(retry(3));
  }

  fetchManualPage(pageName: string): Observable<Page> {
    const hostName = this.originUrl || ''; // for ssr
    return this.http
    .get<Page>(hostName + '/api/pages/manual/' + encodeURIComponent(pageName))
    .pipe(retry(3));
  }
}
