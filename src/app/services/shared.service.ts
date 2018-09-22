import { EventMessage } from '../models/error.model';
import { environment } from 'environments/environment';
import { Subject } from 'rxjs';

export const appTitle = 'Jazyk';
export const awsPath = 's3.eu-central-1.amazonaws.com/jazyk/';

export class SharedService {
  private eventMessages: EventMessage[] = [];
  private messageLimit = 10;
  exerciseModeChanged = new Subject<boolean>();
  justLoggedInOut = new Subject<boolean>();
  eventMessage = new Subject<EventMessage>();

  // Cross-lazy loaded module Events
  changeExerciseMode(isStarted: boolean) {
    this.exerciseModeChanged.next(isStarted);
  }

  userJustLoggedIn() {
    this.justLoggedInOut.next(true);
  }

  userJustLoggedOut() {
    this.justLoggedInOut.next(false);
  }

  sendEventMessage(newMessage: EventMessage) {
    newMessage.dt = new Date();
    this.eventMessages.unshift(newMessage);
    this.eventMessages.slice(0, this.messageLimit);
    this.eventMessage.next(newMessage);
  }

  get lastEventMessage(): string {
    return this.eventMessages[0] ? this.eventMessages[0].message : '';
  }

  get eventMessageList(): EventMessage[] {
    return this.eventMessages;
  }

  // Dev log
  log(label: string, msg: any, tpe = 'info') {
    if (!environment.production) {
      console.log(label + ':', JSON.stringify(msg, undefined, 2));
    }
  }

  getDaysBetweenDates(firstDate: Date, secondDate: Date): number {
    const oneDay = 24 * 60 * 60 * 1000, // ms in a day
          diffDays = Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay));

    return diffDays;
  }

  clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }

  getBookDifficulty(book): {difficultyWidth: number, difficultyPerc: number} {
    let difficulty = book.difficulty.weight;
    difficulty = Math.max(10, difficulty - 300);
    difficulty = difficulty * 2.3;
    difficulty = Math.min(1000, difficulty);
    const difficultyWidth = Math.round(difficulty / 5),
          difficultyPerc = Math.round(difficulty / 10);
    return {difficultyWidth, difficultyPerc};
  }
}
