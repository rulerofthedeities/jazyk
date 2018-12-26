import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SummaryData, RecentBook, HomeStats } from '../models/dashboard.model';
import { Leader, Position } from '../models/score.model';
import { Message } from '../models/user.model';
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

  fetchCommunication(): Observable<Message[]> {
    return this.http
    .get<Message[]>('/api/dashboard/communication/5')
    .pipe(retry(3));
  }

  fetchRecentBooks(): Observable<RecentBook[]> {
    return this.http
    .get<RecentBook[]>('/api/dashboard/books/5')
    .pipe(retry(3));
  }

  fetchLeaders(max: number): Observable<Leader[]> {
    return this.http
    .get<Leader[]>('/api/dashboard/leaders/' + max.toString())
    .pipe(retry(3));
  }

  fetchUserRank(userId: string): Observable<Position> {
    return this.http
    .get<Position>('/api/dashboard/leaderrank/' + userId)
    .pipe(retry(3));
  }

  fetchHomeStats(): Observable<HomeStats> {
    return this.http
    .get<HomeStats>('/api/scores/stats')
    .pipe(retry(3));
  }
}
