import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Book, UserBook } from '../models/book.model';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';

@Injectable()
export class ReadService {

  constructor(
    private http: HttpClient
  ) {}

  /*** Books ***/

  fetchPublishedBooks(lanCode: string): Observable<Book[]> {
    return this.http
    .get<Book[]>('/api/books/published/' + lanCode)
    .pipe(retry(3));
  }

  fetchUserBooks(lanCode: string): Observable<UserBook[]> {
    return this.http
    .get<UserBook[]>('/api/books/user/' + lanCode)
    .pipe(retry(3));
  }
}
