import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {isLearnedLevel} from '../../services/shared.service';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-learnlevel-bar',
  template: `
    <div class="progress progress-bar-vertical">
      <div
        class="progress-bar progress-bar-success progress-bar-striped"
        role="progressbar"
        aria-valuemin="0"
        [attr.aria-valuenow]="level"
        [attr.aria-valuemax]="maxLevel"
        [style.height.%]="percentage">
        <span class="sr-only">
          {{percentage}}% Level
        </span>
      </div>
    </div>
  `,
  styleUrls: ['learnlevel-bar.component.css']
})

export class LearnLevelBarComponent implements OnInit, OnDestroy {
  @Input() private levelUpdated: BehaviorSubject<number>;
  private componentActive = true;
  percentage: string;
  level: string;
  maxLevel: string;

  ngOnInit() {
    this.maxLevel = isLearnedLevel.toString();
    this.levelUpdated
    .takeWhile(() => this.componentActive)
    .subscribe(event => {
      this.updateLevel(event);
    });
  }

  private updateLevel(newLevel: number) {
    const level = Math.max(0, Math.min(newLevel, isLearnedLevel));
    this.level = level.toString();
    this.percentage = Math.round(level / isLearnedLevel * 100).toString();
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
