import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SummaryData, CommunicationData, RecentBook } from '../models/dashboard.model';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';

@Injectable()
export class DashboardService {

  constructor(
    private http: HttpClient
  ) {}

  fetchCounts(): Observable<SummaryData> {
    return this.http
    .get<SummaryData>('/api/dashboard/count')
    .pipe(retry(3));
  }

  fetchCommunication(): Observable<CommunicationData> {
    return this.http
    .get<CommunicationData>('/api/dashboard/communication/5')
    .pipe(retry(3));
  }

  fetchRecentBooks(): Observable<RecentBook[]> {
    return this.http
    .get<RecentBook[]>('/api/dashboard/books/5')
    .pipe(retry(3));
  }
}
