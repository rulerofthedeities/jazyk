import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-points-earned',
  template: `
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
      this.points = points;
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
