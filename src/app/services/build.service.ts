import {Injectable} from '@angular/core';
import {Http, Headers, URLSearchParams} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {Chapter, Course, Lesson, Language, LanPair} from '../models/course.model';
import {Filter} from '../models/exercise.model';
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

  publishCourse(id: string, isPublish: boolean) {
    const headers = new Headers({'Content-Type': 'application/json'});

    return this.http
    .patch('/api/course/publish/' + id + '/' + +isPublish, {}, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  publicCourse(id: string, isPublic: boolean) {
    const headers = new Headers({'Content-Type': 'application/json'});

    return this.http
    .patch('/api/course/public/' + id + '/' + +isPublic, {}, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  /*** CHAPTERS ***/

  fetchChapters(courseId: string) {
    return this.http
    .get('/api/chapters/' + courseId)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  addChapter(chapter: Chapter) {
    const headers = new Headers({'Content-Type': 'application/json'});

    return this.http
    .post('/api/chapter', JSON.stringify(chapter), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  /*** LESSONS ***/

  fetchLessonsAndChapters(courseId: string) {
    return this.http
    .get('/api/lessons/' + courseId)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchLesson(lessonId: string) {
    return this.http
    .get('/api/lesson/' + lessonId)
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

  /*** WORDS ***/

  fetchFilterWordPairs(filter: Filter, lanpair: LanPair) {
    const params = new URLSearchParams();
    params.set('word', filter.word);
    params.set('languagePair', lanpair.from.slice(0, 2) + lanpair.to.slice(0, 2));
    params.set('languageId', filter.languageId);
    params.set('isFromStart', filter.isFromStart.toString());
    return this.http
    .get('/api/wordpairs/', {search: params})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchWordPair(wordpairId: string) {
    return this.http
    .get('/api/wordpair/' + wordpairId)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }
}
