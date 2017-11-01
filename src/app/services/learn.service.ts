import {Injectable} from '@angular/core';
import {Http, Headers, URLSearchParams} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {Language, Course} from '../models/course.model';
import {Exercise, ExerciseData, ExerciseOptions, Direction, ExerciseResult} from '../models/exercise.model';
import {AuthService} from './auth.service';
import {PreviewService} from './preview.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class LearnService {

  constructor(
    private http: Http,
    private authService: AuthService,
    private previewService: PreviewService
  ) {}

  /*** Courses ***/

  fetchPublicCourses(lan: Language) {
    return this.http
    .get('/api/courses/public/' + lan._id)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchUserCourses() {
    const token = this.authService.getToken(),
          headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    return this.http
    .get('/api/user/courses/learn', {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchCourse(id: string) {
    return this.http
    .get('/api/learn/course/' + id)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  /*** Lessons ***/

  fetchLesson(lessonId: string) {
    return this.http
    .get('/api/lesson/' + lessonId)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchLessonHeaders(courseId: string) {
    return this.http
    .get('/api/lessons/header/' + courseId)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchIntro(lessonId: string) {
    return this.http
    .get('/api/lesson/intro/' + lessonId)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  /*** Choices ***/

  fetchChoices(tpe: string, id: string, isBidirectional: boolean) {
    if (tpe === 'course') {
      return this.fetchCourseChoices(id, isBidirectional);
    } else {
      return this.fetchLessonChoices(id, isBidirectional);
    }
  }

  private fetchLessonChoices(lessonId: string, isBidirectional: boolean) {
    return this.http
    .get('/api/choices/lesson/' + lessonId)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  private fetchCourseChoices(courseId: string, isBidirectional: boolean) {
    return this.http
    .get('/api/choices/course/' + courseId)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  /*** Results ***/

  saveUserResults(data: string) {
    if (this.authService.isLoggedIn()) {
      return this.saveResults(data);
    } else {
      return Observable.of(null);
    }
  }

  private saveResults(data: string) {
    // must be idempotent
    const token = this.authService.getToken(),
          headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    return this.http
    .post('/api/user/results/add', data, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  getPreviousResults(lessonId: string, exerciseIds: string[]) {
    // Get the learn level of the most recent exercises for this lesson
    const token = this.authService.getToken(),
          headers = new Headers(),
          params = new URLSearchParams();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    exerciseIds.forEach((id, i) => {
      params.set('id' + i.toString(), id);
    });
    return this.http
    .get('/api/user/results/lesson/lastperexercise/' + lessonId, {headers, search: params})
    .map(response => response.json().obj || {})
    .catch(error => Observable.throw(error));
  }

  getLessonResults(lessonId: string, step: string) {
    // Get the learn level of all exercises in this lesson
    const token = this.authService.getToken(),
          headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    return this.http
    .get('/api/user/results/lesson/' + step + '/' + lessonId, {headers})
    .map(response => response.json().obj || {})
    .catch(error => Observable.throw(error));
  }

  fetchLessonStepData(lessonId: string) {
    const token = this.authService.getToken(),
          headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    return this.http
    .get('/api/user/results/lesson/countbystep/' + lessonId, {headers})
    .map(response => response.json().obj || {})
    .catch(error => Observable.throw(error));
  }

  fetchMostRecentLesson(courseId: string) {
    // Get the most recent lesson saved for this course
    const token = this.authService.getToken(),
          headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    return this.http
    .get('/api/user/results/course/currentlesson/' + courseId, {headers})
    .map(response => response.json().obj || {})
    .catch(error => Observable.throw(error));
  }

  fetchToReview(courseId: string, max: number) {
    const token = this.authService.getToken(),
          headers = new Headers(),
          params = new URLSearchParams();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    params.set('max', max.toString());
    return this.http
    .get('/api/user/results/course/toreview/' + courseId, {headers, search: params})
    .map(response => response.json().obj || {})
    .catch(error => Observable.throw(error));
  }

  /*** Exercises ***/

  fetchExercises(courseId: string, exerciseIds: string[]) {
    const token = this.authService.getToken(),
          params = new URLSearchParams();
    exerciseIds.forEach((id, i) => {
      params.set('id' + i.toString(), id);
    });
    return this.http
    .get('/api/exercises/course/' + courseId, {search: params})
    .map(response => response.json().obj || {})
    .catch(error => Observable.throw(error));
  }

  buildExerciseData(
    exercises: Exercise[],
    results: ExerciseResult[],
    text: Object,
    options: ExerciseOptions
    ): ExerciseData[] {
    const exerciseData: ExerciseData[] = [];
    // const inverseDirection = options.direction === Direction.LocalToForeign ? Direction.ForeignToLocal : Direction.LocalToForeign;
    let j = 0, filteredResult: ExerciseResult, direction;
    exercises.forEach( (exercise) => {
      filteredResult = null;
      if (results) {
        filteredResult = results.filter(result => result && result.exerciseId === exercise._id)[0];
      }
      if (options.isBidirectional) {
        direction = Math.random() >= 0.5 ? Direction.LocalToForeign : Direction.ForeignToLocal;
      } else {
        direction = options.direction;
      }
      exerciseData[j] = this.buildData(options, filteredResult, text, exercise, direction);
      j++;
      /*
      if (options.isBidirectional) {
        exerciseData[j] = this.buildData(options, filteredResult, text, exercise, inverseDirection);
        j++;
      }
      */
    });
    return exerciseData;
  }

  private buildData(
    options: ExerciseOptions,
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
        direction: direction
      },
      exercise,
      result
    };
    if (options.direction === Direction.ForeignToLocal) {
      // Add local data
      this.previewService.buildForeignData(newData, text, exercise);
    }
    if (options.direction === Direction.LocalToForeign) {
      // Add foreign data
      this.previewService.buildLocalData(newData, text, exercise);
    }

    return newData;
  }

  // https://basarat.gitbooks.io/algorithms/content/docs/shuffling.html
  shuffle<T>(array: T[]): T[] {
    // if it's 1 or 0 items, just return
    if (!array || array.length <= 1) {
      return array;
    }
    // For each index in array
    for (let i = 0; i < array.length; i++) {
      // choose a random not-yet-placed item to place there
      // must be an item AFTER the current item, because the stuff
      // before has all already been placed
      const randomChoiceIndex = this.getRandom(i, array.length - 1);
      // place the random choice in the spot by swapping
      [array[i], array[randomChoiceIndex]] = [array[randomChoiceIndex], array[i]];
    }

    return array;
  }

  private getRandom(floor: number, ceiling: number) {
    return Math.floor(Math.random() * (ceiling - floor + 1)) + floor;
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
      console.log('error percentage', errPerc);
      isCorrect = errPerc > 20 ? false : true;
    }
    return isCorrect;
  }

  /* Filter prefix from word */
  filterPrefix(word: string): string {
    // Remove prefix from word
    let filteredWord = word;
    if (filteredWord) {
      const matches = filteredWord.match(/\[(.*?)\]/);
      if (matches && matches.length > 0) {
        filteredWord = filteredWord.replace(matches[0], '');
      }
      if (filteredWord) {
        filteredWord = filteredWord.trim();
      }
    }
    return filteredWord;
  }

  /*** Config ***/

  fetchLanConfig(lanCode: string) {
    return this.http
    .get('/api/config/lan/' + lanCode)
    .map(conn => conn.json().obj)
    .catch(error => Observable.throw(error));
  }
}
