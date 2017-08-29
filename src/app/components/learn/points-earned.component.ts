import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {TimerObservable} from 'rxjs/observable/TimerObservable';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-points-earned',
  template: `
  EARNED
  <div class="points" [class.added]="!!points">
    {{points ? '+' + points : ""}}
  </div>`,
  styleUrls: ['points-earned.component.css']
})

export class LearnPointsEarnedComponent implements OnInit, OnDestroy {
  @Input() private pointsEarned: Subject<number>;
  private componentActive = true;
  points = 0;

  ngOnInit() {
    this.pointsEarned
    .takeWhile(() => this.componentActive)
    .subscribe(points => {
      console.log('new points', points);
      this.points = points;
      this.clearPoints();
    });
  }

  clearPoints() {
    TimerObservable
    .create(700)
    .takeWhile(() => this.componentActive)
    .subscribe(t => {
      this.points = 0;
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
