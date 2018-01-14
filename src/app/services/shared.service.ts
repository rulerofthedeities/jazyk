import {Injectable, EventEmitter} from '@angular/core';
import {EventMessage} from '../models/error.model';

@Injectable()
export class SharedService {
  private eventMessages: EventMessage[] = [];
  private messageLimit = 10;
  exerciseModeChanged = new EventEmitter();
  justLoggedInOut = new EventEmitter<boolean>();
  eventMessage = new EventEmitter<EventMessage>();

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

  sendEventMessage(newMessage: EventMessage) {
    newMessage.dt = new Date();
    this.eventMessages.unshift(newMessage);
    this.eventMessages.slice(0, this.messageLimit);
    this.eventMessage.emit(newMessage);
  }

  get lastEventMessage(): string {
    return this.eventMessages[0] ? this.eventMessages[0].message : '';
  }

  get eventMessageList(): EventMessage[] {
    return this.eventMessages;
  }
}
