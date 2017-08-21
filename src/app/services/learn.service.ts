import {Injectable} from '@angular/core';
import {Http, Headers, URLSearchParams} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {Language, Course} from '../models/course.model';
import {Exercise, ExerciseData, ExerciseOptions, Direction, ExerciseResult} from '../models/exercise.model';
import {AuthService} from './auth.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class LearnService {

  constructor(
    private http: Http,
    private authService: AuthService
  ) {}

  /*** Courses ***/

  fetchCourses(lan: Language) {
    return this.http
    .get('/api/courses/' + lan._id)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchUserCourses(userId: string) {
    const token = this.authService.getToken(),
          headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    return this.http
    .get('/api/courses/user/' + userId, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchCourse(id: string) {
    return this.http
    .get('/api/course/' + id)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  /*** Lessons ***/

  fetchFirstLesson(courseId: string) {
    return this.http
    .get('/api/lesson/first/' + courseId)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  fetchChoices(lessonId: string, isBidirectional: boolean) {
    return this.http
    .get('/api/choices/' + lessonId + '/' + (isBidirectional ? '1' : '0'))
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
    // must be idempotent?
    const token = this.authService.getToken(),
          headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    return this.http
    .post('/api/results/add', data, {headers})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  getPreviousResults(userId: string, courseId: string, step: string, exerciseIds: string[]) {
    const token = this.authService.getToken(),
          headers = new Headers(),
          params = new URLSearchParams();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', 'Bearer ' + token);
    exerciseIds.forEach((id, i) => {
      params.set('id' + i.toString(), id);
    });
    return this.http
    .get('/api/results/' + userId + '/' + courseId + '/' + step, {headers, search: params})
    .map(response => response.json().obj || {})
    .catch(error => Observable.throw(error));
  }

  /*** Exercises ***/

  buildExerciseData(
    exercises: Exercise[],
    results: ExerciseResult[],
    text: Object,
    options: ExerciseOptions
    ): ExerciseData[] {
    console.log('RESULTS', results);
    const exerciseData: ExerciseData[] = [];
    const inverseDirection = options.direction === Direction.LocalToForeign ? Direction.ForeignToLocal : Direction.LocalToForeign;
    let j = 0, filteredResult: ExerciseResult;
    exercises.forEach( (exercise) => {
      filteredResult = null;
      if (results) {
        filteredResult = results.filter(result => result.exerciseId === exercise._id)[0];
      }
      exerciseData[j] = this.buildData(options, filteredResult, text, exercise, options.direction);
      j++;
      if (options.isBidirectional) {
        exerciseData[j] = this.buildData(options, filteredResult, text, exercise, inverseDirection);
        j++;
      }
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
      this.buildForeignData(newData, text, exercise);
    }
    if (options.direction === Direction.LocalToForeign) {
      // Add foreign data
      this.buildLocalData(newData, text, exercise);
    }

    return newData;
  }

  private buildForeignData(exerciseData: ExerciseData, text: Object, exercise: Exercise) {
    const annotations: string[] = [];
    let suffix: string;
    let genus: string;
    genus = '';
    suffix = '';
    // Annotations
    if (exercise.foreign.annotations) {
      const annotationArr = exercise.foreign.annotations.split('|');
      annotationArr.forEach(annotation => {
        annotations.push(annotation);      });
    }
    // genus
    if (exercise.genus) {
      genus = '(' + exercise.genus.toLowerCase() + ')';
    }
    // suffix
    if (exercise.followingCase) {
      suffix =  text['case' + exercise.followingCase];
      if (suffix) {
        suffix = '(+' + suffix.slice(0, 1).toUpperCase() + ')';
      }
    }
    exerciseData.data.annotations = annotations;
    exerciseData.data.hint = exercise.foreign.hint;
    exerciseData.data.genus = genus;
    exerciseData.data.suffix = suffix;
  }

  private buildLocalData(exerciseData: ExerciseData, text: Object, exercise: Exercise) {
    const annotations: string[] = [];
    // Annotations
    if (exercise.local.annotations) {
      const annotationArr = exercise.local.annotations.split('|');
      annotationArr.forEach(annotation => {
        annotations.push(annotation);      });
    }
    exerciseData.data.annotations = annotations;
    exerciseData.data.hint = exercise.local.hint;
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

  isAlmostCorrect(answer: string, solution: string): boolean {
    let isCorrect = false;
    if (solution) {
      const DL = this.getDamerauLevenshteinDistance(answer, solution);
      const errPerc = DL / solution.length * 100;
      console.log('error percentage', errPerc);
      isCorrect = errPerc > 20 ? false : true;
    }

    return isCorrect;
  }

  // https://gist.github.com/IceCreamYou/8396172
  private getDamerauLevenshteinDistance(source: string, target: string): number {
    if (!source) {
      return target ? target.length : 0;
    } else if (!target) {
      return source.length;
    }

    const sourceLength = source.length,
          targetLength = target.length,
          INF = sourceLength + targetLength,
          score = new Array(sourceLength + 2),
          sd = {};
    let DB: number;

    for (let i = 0; i < sourceLength + 2; i++) {
      score[i] = new Array(targetLength + 2);
    }
    score[0][0] = INF;
    for (let i = 0; i <= sourceLength; i++) {
      score[i + 1][1] = i;
      score[i + 1][0] = INF;
      sd[source[i]] = 0;
    }
    for (let j = 0; j <= targetLength; j++) {
      score[1][j + 1] = j;
      score[0][j + 1] = INF;
      sd[target[j]] = 0;
    }
    for (let i = 1; i <= sourceLength; i++) {
      DB = 0;
      for (let j = 1; j <= targetLength; j++) {
        const i1 = sd[target[j - 1]],
              j1 = DB;
        if (source[i - 1] === target[j - 1]) {
          score[i + 1][j + 1] = score[i][j];
          DB = j;
        } else {
          score[i + 1][j + 1] = Math.min(score[i][j], Math.min(score[i + 1][j], score[i][j + 1])) + 1;
        }
        score[i + 1][j + 1] = Math.min(score[i + 1][j + 1], score[i1] ? score[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1) : Infinity);
      }
      sd[source[i - 1]] = i;
    }
    return score[sourceLength + 1][targetLength + 1];
  }

  /*** Config ***/

  fetchLanConfig(lanCode: string) {
    return this.http
    .get('/api/config/lan/' + lanCode)
    .map(conn => conn.json().obj)
    .catch(error => Observable.throw(error));
  }
}
