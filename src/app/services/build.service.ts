import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {Course, Lesson, Language} from '../models/course.model';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class BuildService {

  constructor(
    private http: Http
  ) {}

  /*** COURSES ***/

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

  /*** LESSONS ***/

  fetchLessons(courseId: string) {
    return this.http
    .get('/api/lessons/' + courseId)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  addLesson(lesson: Lesson) {
    const headers = new Headers({'Content-Type': 'application/json'});

    return this.http
    .post('/api/lesson', JSON.stringify(lesson), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateLesson(lesson: Lesson) {
    const headers = new Headers({'Content-Type': 'application/json'});

    return this.http
    .put('/api/lesson', JSON.stringify(lesson), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  /*** CHAPTERS ***/

  fetchChapters(courseId: string) {
    return this.http
    .get('/api/lessons/chapters/' + courseId)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

}
