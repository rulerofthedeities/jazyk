import {Injectable, EventEmitter} from '@angular/core';

@Injectable()
export class SharedService {
  countDownFinishedEvent = new EventEmitter();

  // Cross-lazy loaded module Events
  countDownFinished() {
    this.countDownFinishedEvent.emit();
  }
}
