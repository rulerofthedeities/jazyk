import {Injectable} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {Language, Course} from '../models/course.model';
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
