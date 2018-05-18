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

    return this.http
    .get<Page>('/api/pages/info/' + filteredPage + '/' + lan)
    .pipe(retry(3));
  }

  loadRouteScript() {
    // for routes in sanitized html
    const body = <HTMLDivElement>document.body,
          script = document.createElement('script');
    script.innerHTML = `
    function goToRoute(route) {
      var event = new CustomEvent(
        'route-event',
        {detail: {route: route}}
      );
      window.dispatchEvent(event);
    }`;
    body.appendChild(script);
  }
}
