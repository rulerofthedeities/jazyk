import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {ExerciseData} from '../../models/exercise.model';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-bullets',
  template: `
    <div class="bullets">
      <span 
        *ngFor="let exercise of exercises; let i=index"
        class="fa"
        [ngClass]="{
          'fa-square-o': !exercise.data.isDone, 
          'fa-square': exercise.data.isDone, 
          'green': exercise.result || (exercise.data.isDone && exercise.data.isCorrect && !exercise.data.isAlt),
          'yellow': exercise.data.isDone && exercise.data.isCorrect && exercise.data.isAlt,
          'orange': exercise.data.isDone && !exercise.data.isCorrect && exercise.data.isAlmostCorrect,
          'red': i===current && !exercise.data.isDone || 
                 exercise.data.isDone && !exercise.data.isCorrect && !exercise.data.isAlmostCorrect}">
     </span>
     <span
       *ngFor="let bullet of emptyBullets; let i=index"
       class="fa fa-square-o green"
       [class.fix]="i===0">
     </span>
    </div>`,
  styles: [`
    .bullets{
      color: grey;
      font-size: 18px;
      margin-top: 8px;
      height: 26px;
    }
    .bullets span {
      margin: 0 1px;
    }
    .bullets span.fix {
      margin-left: -3px;
    }
  `]
})

export class LearnBulletsComponent implements OnInit, OnDestroy {
  @Input() private onExerciseAdded: Subject<boolean>;
  @Input() exercises: ExerciseData[];
  @Input() current: number;
  @Input() min = 0;
  private componentActive = true;
  emptyBullets: number[] = [];

  ngOnInit() {
    this.setEmptyBullets();
    this.onExerciseAdded
    .takeWhile(() => this.componentActive)
    .subscribe(event => {
      this.setEmptyBullets();
    });
  }

  private setEmptyBullets() {
    // Add empty bullets if min nr of exercises > actual # of exercises
    if (this.min > this.exercises.length) {
      this.emptyBullets = Array(this.min - this.exercises.length).fill(0);
    } else {
      this.emptyBullets = [];
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
