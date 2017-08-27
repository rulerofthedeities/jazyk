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
  @Input() levelUpdated: BehaviorSubject<number>;
  @Input() maxLevel: number;
  private componentActive = true;
  percentage: string;
  level: string;

  ngOnInit() {
    console.log('subscribing to level');
    this.levelUpdated
    .takeWhile(() => this.componentActive)
    .subscribe(event => {
      console.log('level updated', event);
      this.updateLevel(event);
    });
  }

  private updateLevel(newLevel: number) {
    const level = Math.max(0, Math.min(newLevel, this.maxLevel));
    console.log('level', level);
    this.level = level.toString();
    this.percentage = Math.round(level / this.maxLevel * 100).toString();
    console.log('percentage', this.percentage);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
