import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
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
    level: {{level}}/{{maxLevel}} ({{percentage}}%)
  `,
  styleUrls: ['learnlevel-bar.component.css']
})

export class LearnLevelBarComponent implements OnInit, OnDestroy {
  @Input() private levelUpdated: BehaviorSubject<number>;
  @Input() private maxLevel: number;
  private componentActive = true;
  percentage: string;
  level: string;

  ngOnInit() {
    this.levelUpdated
    .takeWhile(() => this.componentActive)
    .subscribe(event => {
      this.updateLevel(event);
    });
  }

  private updateLevel(newLevel: number) {
    const level = Math.max(0, Math.min(newLevel, this.maxLevel));
    this.level = level.toString();
    this.percentage = Math.round(level / this.maxLevel * 100).toString();
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
