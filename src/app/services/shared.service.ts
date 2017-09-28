import {Injectable, EventEmitter} from '@angular/core';

@Injectable()
export class SharedService {
  exerciseModeChanged = new EventEmitter();

  // Cross-lazy loaded module Events
  changeExerciseMode(isStarted: boolean) {
    this.exerciseModeChanged.emit(isStarted);
  }
}
