import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {ExerciseData} from '../../models/exercise.model';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-bullets',
  templateUrl: 'bullets.component.html',
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
    if (this.onExerciseAdded) {
      this.onExerciseAdded
      .takeWhile(() => this.componentActive)
      .subscribe(event => {
        this.setEmptyBullets();
      });
    }
  }

  private setEmptyBullets() {
    console.log('BULLETS: ', this.exercises.length, this.min);
    // Add empty bullets if min nr of exercises > actual # of exercises
    if (this.exercises && this.min > this.exercises.length) {
      this.emptyBullets = Array(this.min - this.exercises.length).fill(0);
    } else {
      this.emptyBullets = [];
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
