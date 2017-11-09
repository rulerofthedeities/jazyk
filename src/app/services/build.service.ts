import {Injectable} from '@angular/core';
import {Http, Headers, URLSearchParams} from '@angular/http';
import {AuthService} from './auth.service';
import {Course, Lesson, LessonId, Language, LanPair} from '../models/course.model';
import {Exercise} from '../models/exercise.model';
import {Filter} from '../models/word.model';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class BuildService {

  constructor(
    private http: Http,
    private authService: AuthService
  ) {}

  /*** COURSES ***/

  fetchCourses(lan: Language) {
    return this.http
    .get('/api/courses/' + lan._id)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchCourse(courseId: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .get('/api/build/course/' + courseId, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  addCourse(course: Course) {
    const headers = this.getTokenHeaders();
    return this.http
    .post('/api/build/course', JSON.stringify(course), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateCourseHeader(course: Course) {
    const headers = this.getTokenHeaders();
    return this.http
    .put('/api/build/course/header', JSON.stringify(course), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateCourseProperty(courseId: string, property: string, isProperty: boolean) {
    const headers = this.getTokenHeaders();
    const data = {[property]: isProperty};
    return this.http
    .patch('/api/build/course/property/' + courseId, JSON.stringify(data), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateCourseLesson(courseId: string, chapterName: string, lessonId: string) {
    const headers = this.getTokenHeaders();
    const data = {chapterName, lessonId};
    return this.http
    .patch('/api/build/course/lesson/' + courseId, JSON.stringify(data), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchAuthorCourses() {
    const headers = this.getTokenHeaders();
    return this.http
    .get('/api/build/courses', {headers})
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

  addChapter(courseId: string, chapterName: string, lessonId: string) {
    const headers = this.getTokenHeaders();
    const lesson = {chapter: chapterName, lessonIds: [lessonId]};
    return this.http
    .post('/api/build/chapter/' + courseId,  JSON.stringify({chapterName, lesson}), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  removeChapter(courseId: string, chapter: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .put('/api/build/chapter/' + courseId,  JSON.stringify({name: chapter}), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateChapters(courseId: string, chapters: string[]) {
    const headers = this.getTokenHeaders();
    return this.http
    .put('/api/build/chapters/' + courseId, JSON.stringify(chapters), {headers})
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

  fetchLesson(lessonId: string) {
    return this.http
    .get('/api/lesson/' + lessonId)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  addLesson(lesson: Lesson) {
    const headers = this.getTokenHeaders();
    return this.http
    .post('/api/build/lesson', JSON.stringify(lesson), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateLessonHeader(lesson: Lesson) {
    const headers = this.getTokenHeaders();
    return this.http
    .put('/api/build/lesson/header', JSON.stringify(lesson), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  removeLesson(lessonId: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .delete('/api/build/lesson/' + lessonId, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateLessonIds(courseId: string, lessonIds: LessonId[]) {
    const headers = this.getTokenHeaders();
    return this.http
    .put('/api/build/lessonIds/' + courseId, JSON.stringify(lessonIds), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateIntro(lessonId: string, intro: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .put('/api/build/lesson/intro/' + lessonId, {intro}, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchIntro(lessonId: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .get('/api/lesson/intro/' + lessonId, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  /*** WORDS ***/

  fetchFilterWordPairs(filter: Filter, lanpair: LanPair) {
    const headers = this.getTokenHeaders();
    const params = new URLSearchParams();
    params.set('word', filter.word);
    params.set('languagePair', lanpair.from.slice(0, 2) + ';' + lanpair.to.slice(0, 2));
    params.set('languageId', filter.languageId);
    params.set('limit', filter.limit.toString());
    params.set('isFromStart', filter.isFromStart.toString());
    params.set('isExact', filter.isExact.toString());
    params.set('getTotal', filter.getTotal.toString());
    return this.http
    .get('/api/build/wordpairs', {search: params, headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchWordPairDetail(wordpairId: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .get('/api/build/wordpair/' + wordpairId, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchMedia(wordPairId: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .get('/api/build/wordpair/media/' + wordPairId, {headers})
    .map(conn => conn.json().obj)
    .catch(error => Observable.throw(error));
  }

  /*** EXERCISES ***/

  addExercises(exercises: Exercise[], lessonId: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .post('/api/build/exercise/' + lessonId, JSON.stringify(exercises), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateExercise(exercise: Exercise, lessonId: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .put('/api/build/exercise/' + lessonId, JSON.stringify(exercise), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateExercises(exercises: Exercise[], lessonId: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .put('/api/build/exercises/' + lessonId, JSON.stringify(exercises), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  removeExercise(exerciseId: string, lessonId: string) {
    const headers = this.getTokenHeaders();
    return this.http
    .delete('/api/build/exercise/' + lessonId + '/' + exerciseId, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  /*** Config ***/

  fetchLanConfig(lanCode: string) {
    return this.http
    .get('/api/config/lan/' + lanCode)
    .map(conn => conn.json().obj)
    .catch(error => Observable.throw(error));
  }

  /*** Common ***/

  private getTokenHeaders(): Headers {
    const token = this.authService.getToken(),
          headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    return headers;
  }
}
