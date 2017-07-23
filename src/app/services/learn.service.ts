import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {Language, Course} from '../models/course.model';
import {Exercise, ExerciseData, ExerciseOptions, Direction} from '../models/exercise.model';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class LearnService {

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

  buildExerciseData(exercises: Exercise[], text: Object, options: ExerciseOptions): ExerciseData[] {
    const exerciseData: ExerciseData[] = [];
    const inverseDirection = options.direction === Direction.LocalToForeign ? Direction.ForeignToLocal : Direction.LocalToForeign;
    let j = 0;
    exercises.forEach( (exercise, i) => {
      exerciseData[j] = this.buildData(options, text, exercise, options.direction);
      j++;
      if (options.isBidirectional) {
        exerciseData[j] = this.buildData(options, text, exercise, inverseDirection);
        j++;
      }

    });
    console.log('exerciseData', exerciseData);
    return exerciseData;
  }

  private buildData(options: ExerciseOptions, text: Object, exercise: Exercise, direction: Direction): ExerciseData {
    const newData: ExerciseData = {
      data: {
        isDone: false,
        isCorrect: false,
        answered: 0,
        direction: direction
      },
      exercise: exercise
    };
    if (options.nrOfChoices) {
      newData.data.nrOfChoices = options.nrOfChoices;
    }
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
    if (exercise.wordTpe) {
      annotations.push(text[exercise.wordTpe]);
    }
    if (exercise.aspect) {
      annotations.push(text[exercise.aspect]);
    }
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
    if (exercise.aspect) {
      annotations.push(text[exercise.aspect]);
    }
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

}
