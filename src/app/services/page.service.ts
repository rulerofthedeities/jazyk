import { Injectable, Optional, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common';
import { Page } from '../models/page.model';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';

@Injectable()
export class PageService {
  private baseUrl: string;

  constructor(
    private http: HttpClient,
    @Optional() @Inject(APP_BASE_HREF) origin: string) {
      this.baseUrl = origin;
      console.log('BASE URL', origin);
    }

  fetchInfoPage(page: string, lan: string, loggedIn: boolean): Observable<Page> {
    const filteredPage = page.replace(/\W/g, '');

    return this.http
    .get<Page>('/api/pages/info/' + filteredPage + '/' + lan + '/' + loggedIn.toString())
    .pipe(retry(3));
  }

  fetchTestInfoPage(): Observable<Page> {
    console.log('BASE_HREF', APP_BASE_HREF);
    return this.http
    .get<Page>('http://localhost:9001/api/pages/info/features/en/0');
  }

  loadRouteScript() {
    // for routes in sanitized html
  }
}
