import {Injectable, EventEmitter} from '@angular/core';

@Injectable()
export class SharedService {
  exerciseModeChanged = new EventEmitter();
  justLoggedInOut = new EventEmitter<boolean>();

  // Cross-lazy loaded module Events
  changeExerciseMode(isStarted: boolean) {
    this.exerciseModeChanged.emit(isStarted);
  }

  userJustLoggedIn() {
    this.justLoggedInOut.emit(true);
  }

  userJustLoggedOut() {
    this.justLoggedInOut.emit(false);
  }
}
