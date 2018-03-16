import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {AuthService} from './auth.service';
import {Course, Lesson, LessonId, Language, LanPair, LanConfig, LanConfigs, Intro, Dialogue} from '../models/course.model';
import {Exercise} from '../models/exercise.model';
import {Filter, WordPair, WordPairDetail, Media} from '../models/word.model';
import {Observable} from 'rxjs/Observable';
import {retry, delay, map} from 'rxjs/operators';

@Injectable()
export class BuildService {

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /*** COURSES ***/

  fetchCourse(courseId: string): Observable<Course> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<Course>('/api/build/course/' + courseId, {headers})
    .pipe(retry(3));
  }
  
  fetchAuthorCourses(): Observable<Course[]> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<Course[]>('/api/build/courses', {headers})
    .pipe(retry(3));
  }

  addCourse(course: Course): Observable<Course> {
    const headers = this.getTokenHeaders();
    return this.http
    .post<Course>('/api/build/course', JSON.stringify(course), {headers});
  }

  updateCourseHeader(course: Course): Observable<Course> {
    const headers = this.getTokenHeaders();
    return this.http
    .put<Course>('/api/build/course/header', JSON.stringify(course), {headers});
  }

  updateCourseProperty(courseId: string, property: string, isProperty: boolean): Observable<Course> {
    const headers = this.getTokenHeaders(),
          data = {[property]: isProperty};
    return this.http
    .patch<Course>('/api/build/course/property/' + courseId, JSON.stringify(data), {headers});
  }

  updateCourseLesson(courseId: string, chapterName: string, lessonId: string): Observable<Course> {
    // add lesson Id to list of lesson ids in course
    const headers = this.getTokenHeaders(),
          data = {chapterName, lessonId};
    return this.http
    .patch<Course>('/api/build/course/lesson/' + courseId, JSON.stringify(data), {headers});
  }

  updateLessonIds(courseId: string, lessonIds: LessonId[]): Observable<Course> {
    const headers = this.getTokenHeaders();
    return this.http
    .put<Course>('/api/build/lessonIds/' + courseId, JSON.stringify(lessonIds), {headers});
  }

  /*** CHAPTERS ***/

/*
  fetchChapters(courseId: string) {
    return this.http
    .get('/api/chapters/' + courseId)
    .pipe(retry(3));
  }
*/

  addChapter(courseId: string, chapterName: string, lessonId: string): Observable<Course> {
    const headers = this.getTokenHeaders(),
          lesson = {chapter: chapterName, lessonIds: [lessonId]};
    return this.http
    .post<Course>('/api/build/chapter/' + courseId + '/' + lessonId,  JSON.stringify({chapterName, lesson}), {headers});
  }

  removeChapter(courseId: string, chapter: string): Observable<Course> {
    const headers = this.getTokenHeaders();
    return this.http
    .put<Course>('/api/build/chapter/' + courseId, JSON.stringify({name: chapter}), {headers});
  }

  updateChapters(courseId: string, chapters: string[]): Observable<Course> {
    const headers = this.getTokenHeaders();
    return this.http
    .put<Course>('/api/build/chapters/' + courseId, JSON.stringify(chapters), {headers});
  }

  getCourseChapters(course: Course): string[] {
    return course.chapters; /*
    .filter(el => el.lessonIds.length > 0)
    .map(el => el.chapter);*/
  }

  /*** LESSONS ***/

  fetchLessons(courseId: string): Observable<Lesson[]> {
    return this.http
    .get<Lesson[]>('/api/lessons/' + courseId)
    .pipe(retry(3));
  }

  fetchLesson(lessonId: string): Observable<Lesson> {
    return this.http
    .get<Lesson>('/api/lesson/' + lessonId)
    .pipe(retry(3));
  }

  addLesson(lesson: Lesson): Observable<Lesson> {
    const headers = this.getTokenHeaders();
    return this.http
    .post<Lesson>('/api/build/lesson', JSON.stringify(lesson), {headers});
  }

  updateLessonHeader(lesson: Lesson): Observable<Lesson> {
    const headers = this.getTokenHeaders();
    return this.http
    .put<Lesson>('/api/build/lesson/header', JSON.stringify(lesson), {headers});
  }

  removeLesson(lessonId: string): Observable<Lesson> {
    const headers = this.getTokenHeaders();
    return this.http
    .delete<Lesson>('/api/build/lesson/' + lessonId, {headers});
  }

  fetchIntro(lessonId: string): Observable<Intro> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<Intro>('/api/lesson/intro/' + lessonId, {headers})
    .pipe(retry(3));
  }

  updateIntro(lessonId: string, intro: string): Observable<Lesson> {
    const headers = this.getTokenHeaders();
    return this.http
    .put<Lesson>('/api/build/lesson/intro/' + lessonId, {intro}, {headers});
  }

  fetchDialogue(lessonId: string): Observable<Dialogue> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<Dialogue>('/api/lesson/dialogue/' + lessonId, {headers})
    .pipe(retry(3));
  }

  updateDialogue(lessonId: string, dialogue: Dialogue): Observable<Lesson> {
    const headers = this.getTokenHeaders();
    return this.http
    .put<Lesson>('/api/build/lesson/dialogue/' + lessonId, {dialogue}, {headers});
  }

  /*** WORDS ***/

  fetchFilterWordPairs(filter: Filter, lanpair: LanPair): Observable<WordPair[]> {
    const headers = this.getTokenHeaders(),
          params = {
            'word': filter.word,
            'languagePair': lanpair.from.slice(0, 2) + ';' + lanpair.to.slice(0, 2),
            'languageId': filter.languageId,
            'limit': filter.limit.toString(),
            'isFromStart': filter.isFromStart.toString(),
            'isExact': filter.isExact.toString(),
            'getTotal': filter.getTotal.toString()
          };
    return this.http
    .get<WordPair[]>('/api/build/wordpairs', {headers, params})
    .pipe(retry(3));
  }

  fetchWordPairDetail(wordpairId: string): Observable<WordPairDetail> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<WordPairDetail>('/api/build/wordpair/' + wordpairId, {headers})
    .pipe(retry(3));
  }

  fetchMedia(wordPairId: string): Observable<Media> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<Media>('/api/build/wordpair/media/' + wordPairId, {headers})
    .pipe(retry(3));
  }

  /*** EXERCISES ***/

  addExercises(exercises: Exercise[], lessonId: string): Observable<Exercise[]> {
    const headers = this.getTokenHeaders();
    return this.http
    .post<Exercise[]>('/api/build/exercise/' + lessonId, JSON.stringify(exercises), {headers});
  }

  updateExercise(exercise: Exercise, lessonId: string): Observable<Lesson> {
    const headers = this.getTokenHeaders();
    return this.http
    .put<Lesson>('/api/build/exercise/' + lessonId, JSON.stringify(exercise), {headers});
  }

  updateExercises(exercises: Exercise[], lessonId: string): Observable<Lesson> {
    const headers = this.getTokenHeaders();
    return this.http
    .put<Lesson>('/api/build/exercises/' + lessonId, JSON.stringify(exercises), {headers});
  }

  removeExercise(exerciseId: string, lessonId: string): Observable<Lesson> {
    const headers = this.getTokenHeaders();
    return this.http
    .delete<Lesson>('/api/build/exercise/' + lessonId + '/' + exerciseId, {headers});
  }

  /*** Config ***/

  fetchLanConfig(lanCode: string): Observable<LanConfig> {
    return this.http
    .get<LanConfig>('/api/config/lan/' + lanCode)
    .pipe(retry(3));
  }

  fetchLanConfigs(lanPair: LanPair): Observable<LanConfigs> {
    return this.http
    .get<LanConfigs>('/api/config/lanpair/' + lanPair.from + '/' + lanPair.to)
    .pipe(retry(3));
  }

  /*** Common ***/

  private getTokenHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this.authService.getToken();
    headers = headers.append('Content-Type', 'application/json');
    headers = headers.append('Authorization', 'Bearer ' + token);
    return headers;
  }
}
