import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {Language, Course} from '../models/course.model';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class CourseService {

  constructor(
    private http: Http
  ) {}

  fetchCourses(lan: Language) {
    return this.http
    .get('/api/courses/' + lan._id)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchCourse(id: string) {
    return this.http
    .get('/api/course/' + id)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  addCourse(course: Course) {
    const headers = new Headers({'Content-Type': 'application/json'});

    return this.http
    .post('/api/course', JSON.stringify(course), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateCourse(course: Course) {
    const headers = new Headers({'Content-Type': 'application/json'});

    return this.http
    .put('/api/course', JSON.stringify(course), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }
}
