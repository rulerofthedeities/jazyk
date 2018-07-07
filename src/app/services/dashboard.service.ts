import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {AuthService} from './auth.service';
import {SummaryData, CommunicationData, RecentCourse} from '../models/dashboard.model';
import {StepData} from '../models/course.model';
import {Observable, of} from 'rxjs';
import {retry, delay, map} from 'rxjs/operators';

@Injectable()
export class DashboardService {

  constructor(
    private http: HttpClient,
    private authService: AuthService
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

  fetchRecentCourses(): Observable<RecentCourse[]> {
    return this.http
    .get<RecentCourse[]>('/api/dashboard/courses/3')
    .pipe(retry(3));
  }

  fetchCourseSteps(courseId: string): Observable<StepData> {
    if (this.authService.isLoggedIn()) { // Not for demos
      return this.http
      .get<StepData>('/api/user/results/course/summary/' + courseId)
      .pipe(retry(3));
    } else {
      return of(null);
    }
  }

  fetchCourseDone(courseId: string): Observable<Array<number>> {
    if (this.authService.isLoggedIn()) { // Not for demos
      return this.http
      .get<Array<number>>('/api/user/results/course/count/' + courseId)
      .pipe(retry(3));
    } else {
      return of(null);
    }
  }

  checkCourseFollowed(courseId: string): Observable<boolean> {
    return this.http
    .get<boolean>('/api/user/courseFollowed/' + courseId)
    .pipe(retry(3));
  }
}
