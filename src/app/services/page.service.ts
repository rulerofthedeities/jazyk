import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Page } from '../models/page.model';
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
          hostName = this.originUrl || '',
          url = hostName + '/api/pages/info/' + filteredPage + '/' + lan + '/' + loggedIn.toString();

    return this.http
    .get<Page>(url)
    .pipe(retry(3));
  }

  loadRouteScript() {
    // for routes in sanitized html
  }
}
