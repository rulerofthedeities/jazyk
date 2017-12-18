import * as moment from 'moment';

export class TimeService {
  startTime: Date;
  endTime: Date;

  constructor() {}

  startTimer() {
    this.startTime = new Date();
  }

  endTimer() {
    this.endTime = new Date();
  }

  getTimeElapsedSeconds(): number {
    const diff: number = (this.endTime.getTime() - this.startTime.getTime()) / 1000;
    return diff;
  }

  getTimeElapsedTime(): string {
    const elapsed = this.getTimeElapsedSeconds();

    const hours   = Math.floor(elapsed / 3600),
          mins = Math.floor((elapsed - (hours * 3600)) / 60),
          secs = Math.floor(elapsed - (hours * 3600) - (mins * 60));

    return this.pad(hours) + ':' + this.pad(mins) + ':' + this.pad(secs);
  }

  pad(num: number): string {
    return ('0' + num).slice(-2);
  }
}
