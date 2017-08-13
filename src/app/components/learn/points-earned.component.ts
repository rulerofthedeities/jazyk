import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-points-earned',
  template: `
  <div class="points" [class.added]="!!points">
    {{points ? '+'+points : ""}}
  </div>`,
  styles: [`
    .points {
      font-size: 24px;
    }
    .added {
      animation: bump 0.5s ease-out forwards;
    }
    @keyframes bump {
      0% {
        margin-top: 12px;
        margin-left: 12px;
        font-size: 24px;
      }
      90% {
        margin-top: -6px;
        margin-left: -6px;
        font-size: 60px;
      }
      100% {
        font-size: 48px;
      }
    }
  `]
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
