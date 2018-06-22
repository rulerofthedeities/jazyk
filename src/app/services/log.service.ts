import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable()
export class LogService {

  constructor(
    private http: HttpClient
  ) {}

  logPage(page: String): Observable<string> {
    console.log('logging page', page);
    return this.http
    .post<string>('/api/log/page', {page});
  }
}
