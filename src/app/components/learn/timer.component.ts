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
  color = 'green';
  barLength = 100;
  totalTimeMs: number;
  currentTimeMs: number;

  ngOnInit() {
    this.cutOffs = this.data.data.timeCutoffs;
    this.totalTimeMs = this.cutOffs.total() * 100;
    this.currentTimeMs = this.totalTimeMs;
    this.startDate = new Date();
    console.log('start timer', this.startDate);
    this.changeColor(this.cutOffs.green, 'orange');
    this.changeBar();
  }

  private changeColor(time: number, color: string) {
    setTimeout(() => {
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
    .takeWhile(() => this.componentActive && this.barLength > 0)
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
