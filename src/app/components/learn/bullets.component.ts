import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {ExerciseData} from '../../models/exercise.model';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
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
  @Input() private onNextExercise: BehaviorSubject<number>;
  @Input() private exercises: ExerciseData[] = [];
  @Input() current: number;
  private componentActive = true;
  exerciseBullets: ExerciseData[];

  ngOnInit() {
    console.log('bullet exercises', this.exercises);
    if (this.onNextExercise) {
      this.onNextExercise
      .takeWhile(() => this.componentActive)
      .subscribe(event => {
        this.sliceExercises(event);
      });
    } else {
      this.exerciseBullets = this.exercises;
    }
    console.log('bullet exercises', this.exerciseBullets);
  }

  private sliceExercises(i: number) {
    if (this.exercises && this.exercises.length > 0) {
      this.exerciseBullets = this.exercises.slice(0, i + 1);
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
