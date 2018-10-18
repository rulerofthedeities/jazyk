import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Page } from '../models/page.model';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';

@Injectable()
export class PageService {

  constructor(
    private http: HttpClient
  ) {}

  fetchInfoPage(page: string, lan: string, loggedIn: boolean): Observable<Page> {
    const filteredPage = page.replace(/\W/g, '');

    return this.http
    .get<Page>('/api/pages/info/' + filteredPage + '/' + lan + '/' + loggedIn.toString())
    .pipe(retry(3));
  }

  loadRouteScript() {
    // for routes in sanitized html
  }
}
