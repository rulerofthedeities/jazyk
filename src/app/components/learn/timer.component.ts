import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {ExerciseData, TimeCutoffs} from '../../models/exercise.model';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-timer',
  templateUrl: 'timer.component.html',
  styles: [`
  :host {
    display: block;
  }
  .line {
    height: 2px;
  }
  `]
})

export class LearnTimerComponent implements OnInit, OnDestroy {
  @Input() data: ExerciseData;
  private componentActive = true;
  private startDate: Date;
  private cutOffs: TimeCutoffs;
  private totalTimeMs: number;
  private currentTimeMs: number;
  private isAnswered = false;
  private timers = {};
  color = 'green';
  barLength = 100;

  ngOnInit() {
    this.cutOffs = this.data.data.timeCutoffs;
    this.totalTimeMs = this.cutOffs.total() * 100;
    this.currentTimeMs = this.totalTimeMs;
    this.startDate = new Date();
    console.log('start timer', this.startDate);
    this.changeColor(this.cutOffs.green, 'orange');
    this.changeBar();
  }

  getTimeDelta(): number {
    const endDate = new Date();
    this.isAnswered = true;
    clearTimeout(this.timers['orange']);
    clearTimeout(this.timers['red']);
    clearTimeout(this.timers['blue']);
    return (endDate.getTime() - this.startDate.getTime()) / 100;
  }

  private changeColor(time: number, color: string) {
    this.timers[color] = setTimeout(() => {
      console.log('new color', color);
      this.color = color;
      switch (color) {
        case 'orange':
          this.changeColor(this.cutOffs.orange, 'red');
          break;
        case 'red':
          this.changeColor(this.cutOffs.red, 'blue');
          break;
        default:
          console.log('counter finished');
          break;
      }
    }, time * 100);
  }

  private changeBar() {
    const step = 100,
          timer = TimerObservable.create(0, step);
    let percTogo = 0;
    timer
    .takeWhile(() => this.componentActive && this.barLength > 0 && this.isAnswered === false)
    .subscribe(t => {
      this.currentTimeMs -= step;
      percTogo = Math.trunc(this.currentTimeMs / this.totalTimeMs * 1000) / 10;
      this.barLength = Math.max(0, percTogo);
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
