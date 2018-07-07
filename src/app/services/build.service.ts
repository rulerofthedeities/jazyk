import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {AuthService} from './auth.service';
import {Course, Lesson, LessonId, LanPair, LanConfig, LanConfigs, Intro, Dialogue} from '../models/course.model';
import {Exercise} from '../models/exercise.model';
import {Filter, WordPair, WordPairDetail, Media} from '../models/word.model';
import {Observable} from 'rxjs';
import {retry} from 'rxjs/operators';

@Injectable()
export class BuildService {

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /*** COURSES ***/

  fetchCourse(courseId: string): Observable<Course> {
    return this.http
    .get<Course>('/api/build/course/' + courseId)
    .pipe(retry(3));
  }

  fetchAuthorCourses(): Observable<Course[]> {
    return this.http
    .get<Course[]>('/api/build/courses')
    .pipe(retry(3));
  }

  addCourse(course: Course): Observable<Course> {
    return this.http
    .post<Course>('/api/build/course', JSON.stringify(course));
  }

  updateCourseHeader(course: Course): Observable<Course> {
    return this.http
    .put<Course>('/api/build/course/header', JSON.stringify(course));
  }

  updateCourseProperty(courseId: string, property: string, isProperty: boolean): Observable<Course> {
    const data = {[property]: isProperty};
    return this.http
    .patch<Course>('/api/build/course/property/' + courseId, JSON.stringify(data));
  }

  updateCourseLesson(courseId: string, chapterName: string, lessonId: string): Observable<Course> {
    // add lesson Id to list of lesson ids in course
    const data = {chapterName, lessonId};
    return this.http
    .patch<Course>('/api/build/course/lesson/' + courseId, JSON.stringify(data));
  }

  updateLessonIds(courseId: string, lessonIds: LessonId[]): Observable<Course> {
    return this.http
    .put<Course>('/api/build/lessonIds/' + courseId, JSON.stringify(lessonIds));
  }

  /*** CHAPTERS ***/

  addChapter(courseId: string, chapterName: string, lessonId: string): Observable<Course> {
    const lesson = {chapter: chapterName, lessonIds: [lessonId]};
    return this.http
    .post<Course>('/api/build/chapter/' + courseId + '/' + lessonId,  JSON.stringify({chapterName, lesson}));
  }

  removeChapter(courseId: string, chapter: string): Observable<Course> {
    return this.http
    .put<Course>('/api/build/chapter/' + courseId, JSON.stringify({name: chapter}));
  }

  updateChapters(courseId: string, chapters: string[]): Observable<Course> {
    return this.http
    .put<Course>('/api/build/chapters/' + courseId, JSON.stringify(chapters));
  }

  getCourseChapters(course: Course): string[] {
    return course.chapters;
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
    return this.http
    .post<Lesson>('/api/build/lesson', JSON.stringify(lesson));
  }

  updateLessonHeader(lesson: Lesson): Observable<Lesson> {
    return this.http
    .put<Lesson>('/api/build/lesson/header', JSON.stringify(lesson));
  }

  removeLesson(lessonId: string): Observable<Lesson> {
    return this.http
    .delete<Lesson>('/api/build/lesson/' + lessonId);
  }

  fetchIntro(lessonId: string): Observable<Intro> {
    return this.http
    .get<Intro>('/api/lesson/intro/' + lessonId)
    .pipe(retry(3));
  }

  updateIntro(lessonId: string, intro: Intro): Observable<Lesson> {
    return this.http
    .put<Lesson>('/api/build/lesson/intro/' + lessonId, {intro});
  }

  fetchDialogue(lessonId: string): Observable<Dialogue> {
    return this.http
    .get<Dialogue>('/api/lesson/dialogue/' + lessonId)
    .pipe(retry(3));
  }

  updateDialogue(lessonId: string, dialogue: Dialogue): Observable<Lesson> {
    return this.http
    .put<Lesson>('/api/build/lesson/dialogue/' + lessonId, {dialogue});
  }

  checkIfWordpairInCourse(wordLocal: string, wordForeign: string, wpId: string, courseId: string): Observable<Exercise[]> {
    return this.http
    .get<Exercise[]>('/api/build/check/wpincourse/' + courseId + '/' + wpId + '/' + wordLocal + '/' + wordForeign)
    .pipe(retry(3));
  }

  /*** WORDS ***/

  fetchFilterWordPairs(filter: Filter, lanpair: LanPair): Observable<WordPair[]> {
    const params = {
            'word': filter.word,
            'languagePair': lanpair.from.slice(0, 2) + ';' + lanpair.to.slice(0, 2),
            'languageId': filter.languageId,
            'limit': filter.limit.toString(),
            'isFromStart': filter.isFromStart.toString(),
            'isExact': filter.isExact.toString(),
            'getTotal': filter.getTotal.toString()
          };
    return this.http
    .get<WordPair[]>('/api/build/wordpairs', {params})
    .pipe(retry(3));
  }

  fetchWordPairDetail(wordpairId: string): Observable<WordPairDetail> {
    return this.http
    .get<WordPairDetail>('/api/build/wordpair/' + wordpairId)
    .pipe(retry(3));
  }

  fetchMedia(wordPairId: string): Observable<Media> {
    return this.http
    .get<Media>('/api/build/wordpair/media/' + wordPairId)
    .pipe(retry(3));
  }

  /*** EXERCISES ***/

  addExercises(exercises: Exercise[], lessonId: string): Observable<Exercise[]> {
    return this.http
    .post<Exercise[]>('/api/build/exercise/' + lessonId, JSON.stringify(exercises));
  }

  updateExercise(exercise: Exercise, lessonId: string): Observable<Lesson> {
    return this.http
    .put<Lesson>('/api/build/exercise/' + lessonId, JSON.stringify(exercise));
  }

  updateExercises(exercises: Exercise[], lessonId: string): Observable<Lesson> {
    return this.http
    .put<Lesson>('/api/build/exercises/' + lessonId, JSON.stringify(exercises));
  }

  removeExercise(exerciseId: string, lessonId: string): Observable<Lesson> {
    return this.http
    .delete<Lesson>('/api/build/exercise/' + lessonId + '/' + exerciseId);
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
}
