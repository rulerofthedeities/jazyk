import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs';
import {takeWhile} from 'rxjs/operators';

@Component({
  selector: 'km-points-earned',
  template: `
  <div class="pointswrapper">
    <div class="points" [class.added]="!!points">
      {{points}}
    </div>
    <div class="points plus" [class.addedplus]="!!points">+</div>
  </div>`,
  styleUrls: ['points-earned.component.css']
})

export class LearnPointsEarnedComponent implements OnInit, OnDestroy {
  @Input() private pointsEarned: Subject<number>;
  private componentActive = true;
  points = 0;

  ngOnInit() {
    this.pointsEarned
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(points => {
      this.points = points;
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
