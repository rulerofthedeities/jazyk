import {Injectable} from '@angular/core';
import {Http, Headers, URLSearchParams} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {Course, Lesson, LessonId, Language, LanPair} from '../models/course.model';
import {Exercise} from '../models/exercise.model';
import {Filter} from '../models/word.model';
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

  updateCourseHeader(course: Course) {
    const headers = new Headers({'Content-Type': 'application/json'});
    return this.http
    .put('/api/course/header', JSON.stringify(course), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateCourseProperty(courseId: string, property: string, isProperty: boolean) {
    const headers = new Headers({'Content-Type': 'application/json'});
    const data = {[property]: isProperty};
    return this.http
    .patch('/api/course/property/' + courseId, JSON.stringify(data), {headers})
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

  addChapter(courseId: string, chapter: string) {
    const headers = new Headers({'Content-Type': 'application/json'});
    return this.http
    .post('/api/chapter/' + courseId,  JSON.stringify({name: chapter}), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  removeChapter(courseId: string, chapter: string) {
    const headers = new Headers({'Content-Type': 'application/json'});
    return this.http
    .put('/api/chapter/' + courseId,  JSON.stringify({name: chapter}), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateChapters(courseId: string, chapters: string[]) {
    const headers = new Headers({'Content-Type': 'application/json'});
    return this.http
    .put('/api/chapters/' + courseId, JSON.stringify(chapters), {headers})
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
    const headers = new Headers({'Content-Type': 'application/json'});
    return this.http
    .post('/api/lesson', JSON.stringify(lesson), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateLessonHeader(lesson: Lesson) {
    const headers = new Headers({'Content-Type': 'application/json'});
    return this.http
    .put('/api/lesson/header', JSON.stringify(lesson), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  removeLesson(lessonId: string) {
    const headers = new Headers({'Content-Type': 'application/json'});
    return this.http
    .delete('/api/lesson/' + lessonId)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateLessonIds(courseId: string, lessonIds: LessonId[]) {
    const headers = new Headers({'Content-Type': 'application/json'});
    return this.http
    .put('/api/lessonIds/' + courseId, JSON.stringify(lessonIds), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  /*** WORDS ***/

  fetchFilterWordPairs(filter: Filter, lanpair: LanPair) {
    const params = new URLSearchParams();
    params.set('word', filter.word);
    params.set('languagePair', lanpair.from.slice(0, 2) + ';' + lanpair.to.slice(0, 2));
    params.set('languageId', filter.languageId);
    params.set('limit', filter.limit.toString());
    params.set('isFromStart', filter.isFromStart.toString());
    params.set('isExact', filter.isExact.toString());
    params.set('getTotal', filter.getTotal.toString());
    return this.http
    .get('/api/wordpairs/', {search: params})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchWordPairDetail(wordpairId: string) {
    return this.http
    .get('/api/wordpair/' + wordpairId)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchMedia(wordPairId: string) {
    return this.http
    .get('/api/wordpair/media/' + wordPairId)
    .map(conn => conn.json().obj)
    .catch(error => Observable.throw(error));
  }

  /*** EXERCISES ***/

  addExercise(exercise: Exercise, lessonId: string) {
    const headers = new Headers({'Content-Type': 'application/json'});

    return this.http
    .post('/api/exercise/' + lessonId, JSON.stringify(exercise), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateExercise(exercise: Exercise, lessonId: string) {
    const headers = new Headers({'Content-Type': 'application/json'});
    return this.http
    .put('/api/exercise/' + lessonId, JSON.stringify(exercise), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  updateExercises(exercises: Exercise[], lessonId: string) {
    const headers = new Headers({'Content-Type': 'application/json'});
    return this.http
    .put('/api/exercises/' + lessonId, JSON.stringify(exercises), {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  removeExercise(exerciseId: string, lessonId: string) {
    return this.http
    .delete('/api/exercise/' + lessonId + '/' + exerciseId)
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
}
