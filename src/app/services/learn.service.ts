import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';
import {Language, LanPair, Course, UserCourse, CourseDefaults, Intro,
        Lesson, LessonHeader, LessonOptions, StepData, LessonResult, LanConfig} from '../models/course.model';
import {Exercise, ExerciseData, ExerciseOptions,
        Direction, ExerciseResult, ResultsData, Choice} from '../models/exercise.model';
import {AuthService} from './auth.service';
import {PreviewService} from './preview.service';
import {retry, delay, map} from 'rxjs/operators';

export const maxLearnLevel = 20; // maximum learn level
export const maxStreak = 20; // maximum length of the streak
export const isLearnedLevel = 12; // minimum level before it is considered learned

interface CourseData {
  isDemo: boolean;
  subscribed: Course[];
  data: UserCourse[];
}

interface ExercisePlusOptions {
  exercise: Exercise;
  options: LessonOptions;
}

interface CourseResults {
  results: ExerciseResult[];
  toreview?: ExercisePlusOptions[];
  difficult?: ExercisePlusOptions[];
}

@Injectable()
export class LearnService {

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private previewService: PreviewService
  ) {}

  /*** Courses ***/

  fetchPublishedCourses(lanCode: string): Observable<Course[]> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<Course[]>('/api/courses/published/' + lanCode, {headers})
    .pipe(retry(3));
  }

  fetchSubscribedCourses(): Observable<CourseData> {
    const headers = this.getTokenHeaders();
    if (this.authService.isLoggedIn()) {
      return this.http
      .get<CourseData>('/api/user/courses/learn', {headers})
      .pipe(retry(3));
    } else {
      return this.http
      .get<CourseData>('/api/courses/demo', {headers})
      .pipe(retry(3));
    }
  }

  fetchCourse(courseId: string): Observable<Course> {
    return this.http
    .get<Course>('/api/learn/course/' + courseId)
    .pipe(retry(3));
  }

  unSubscribeCourse(courseId: string): Observable<string> {
    const headers = this.getTokenHeaders();
    return this.http
    .post<string>('/api/user/unsubscribe', JSON.stringify({courseId}), {headers});
  }

  /*** Lessons ***/

  fetchLesson(lessonId: string): Observable<Lesson> {
    return this.http
    .get<Lesson>('/api/lesson/' + lessonId)
    .pipe(retry(3));
  }

  fetchLessonHeaders(courseId: string): Observable<LessonHeader[]> {
    return this.http
    .get<LessonHeader[]>('/api/lessons/header/' + courseId)
    .pipe(retry(3));
  }

  fetchIntro(lessonId: string): Observable<Intro> {
    return this.http
    .get<Intro>('/api/lesson/intro/' + lessonId)
    .pipe(retry(3));
  }

  fetchLessonResults(courseId: string): Observable<LessonResult[]> {
    if (this.authService.isLoggedIn()) {
      const headers = this.getTokenHeaders();
      return this.http
      .get<LessonResult[]>('/api/user/results/lessons/' + courseId, {headers})
      .pipe(retry(3));
    } else {
      return Observable.of(null);
    }
  }

  /*** Choices ***/

  fetchCourseChoices(courseId: string, lanPair: LanPair): Observable<Choice[]> {
    const lans = lanPair.from + '-' + lanPair.to;
    return this.http
    .get<Choice[]>('/api/choices/course/' + courseId + '/' + lans)
    .pipe(retry(3));
  }

  /*** Results ***/

  saveUserResults(data: string): Observable<number> {
    if (this.authService.isLoggedIn()) {
      // must be idempotent
      const headers = this.getTokenHeaders();
      return this.http
      .post<number>('/api/user/results/add', data, {headers});
    } else {
      return Observable.of(null);
    }
  }

  fetchLessonStepResults(lessonId: string, step: string): Observable<ResultsData> {
    // Get the learn level of all exercises in this lesson
    const headers = this.getTokenHeaders();
    return this.http
    .get<ResultsData>('/api/user/results/lesson/' + step + '/' + lessonId, {headers})
    .pipe(retry(3));
  }

  fetchMostRecentLesson(courseId: string): Observable<string> {
    // Get the most recent lesson saved for this course
    const headers = this.getTokenHeaders();
    return this.http
    .get<string>('/api/user/results/course/currentlesson/' + courseId, {headers})
    .pipe(retry(3));
  }

  fetchStepData(courseId: string, lessonId: string): Observable<StepData> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<StepData>('/api/user/results/countbystep/' + courseId + '/' + lessonId, {headers})
    .pipe(retry(3));
  }

  fetchToReview(courseId: string, max: number): Observable<CourseResults> {
    const headers = this.getTokenHeaders(),
          params = {'max': max.toString()};
    return this.http
    .get<CourseResults>('/api/user/results/course/toreview/' + courseId, {headers, params})
    .pipe(retry(3));
  }

  fetchDifficult(courseId: string, max: number): Observable<CourseResults> {
    const headers = this.getTokenHeaders(),
          params = {'max': max.toString()};
    return this.http
    .get<CourseResults>('/api/user/results/course/difficult/' + courseId, {headers, params})
    .pipe(retry(3));
  }

  fetchScoreTotal(): Observable<number> {
    const headers = this.getTokenHeaders();
    return this.http
    .get<number>('/api/user/score/total', {headers})
    .pipe(retry(3));
  }

  /*** Exercises ***/

  buildExerciseData(
    exercises: Exercise[],
    results: ExerciseResult[],
    text: Object,
    stepOptions: ExerciseOptions,
    lessonOptions: LessonOptions
    ): ExerciseData[] {
    const exerciseData: ExerciseData[] = [];
    // const inverseDirection = options.direction === Direction.LocalToForeign ? Direction.ForeignToLocal : Direction.LocalToForeign;
    let j = 0, filteredResult: ExerciseResult, direction;
    if (exercises) {
      exercises.forEach( (exercise) => {
        filteredResult = null;
        if (results) {
          filteredResult = results.filter(result => result && result.exerciseId === exercise._id)[0];
        }
        if (stepOptions.isBidirectional) {
          direction = Math.random() >= 0.5 ? Direction.LocalToForeign : Direction.ForeignToLocal;
        } else {
          direction = stepOptions.direction;
        }
        exerciseData[j] = this.buildData(stepOptions, lessonOptions, filteredResult, text, exercise, direction);
        j++;
      });
    }
    return exerciseData;
  }

  private buildData(
    stepOptions: ExerciseOptions,
    lessonOptions: LessonOptions,
    result: ExerciseResult,
    text: Object,
    exercise: Exercise,
    direction: Direction
    ): ExerciseData {
    const newData: ExerciseData = {
      data: {
        isDone: false,
        isCorrect: false,
        answered: 0,
        direction: direction,
        isCaseSensitive: lessonOptions ? lessonOptions.caseSensitive : null
      },
      exercise,
      result
    };
    if (stepOptions.direction === Direction.ForeignToLocal) {
      // Add local data
      this.previewService.buildForeignData(newData, text, exercise);
    }
    if (stepOptions.direction === Direction.LocalToForeign) {
      // Add foreign data
      this.previewService.buildLocalData(newData, text, exercise);
    }
    return newData;
  }

  getDaysBetweenDates(firstDate: Date, secondDate: Date): number {
    const oneDay = 24 * 60 * 60 * 1000, // ms in a day
          diffDays = Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay));

    return diffDays;
  }

  clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }

  isAlmostCorrect(answer: string, solution: string): boolean {
    let isCorrect = false;
    if (solution) {
      const DL = this.previewService.getDamerauLevenshteinDistance(answer, solution);
      const errPerc = DL / solution.length * 100;
      isCorrect = errPerc > 20 ? false : true;
    }
    return isCorrect;
  }

  /* Filter prefix from word */
  filterPrefix(word: string): string {
    // Remove prefix from word
    let filteredWord = word;
    if (filteredWord) {
      const matches = word.match(/\((.*?)\)/);
      if (matches && matches.length > 0) {
        filteredWord = filteredWord.replace(matches[0], '');
      }
      if (filteredWord) {
        filteredWord = filteredWord.trim();
      }
    }
    return filteredWord;
  }

  getExamCount(totalCount: number): number {
    // Define # of exam exercises depending on total count
    let examCount = 0;
    if (totalCount >= 2000) {
      examCount = 200;
    } else if (totalCount >= 1000) {
      examCount = 100;
    } else if (totalCount >= 500) {
      examCount = 50;
    }
    return examCount;
  }

  /*** Config ***/

  fetchLanConfig(lanCode: string): Observable<LanConfig> {
    return this.http
    .get<LanConfig>('/api/config/lan/' + lanCode)
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
