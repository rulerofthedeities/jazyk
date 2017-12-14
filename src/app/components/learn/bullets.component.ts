import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {ExerciseData} from '../../models/exercise.model';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-bullets',
  templateUrl: 'bullets.component.html',
  styleUrls: ['bullets.component.css']
})

export class LearnBulletsComponent implements OnInit, OnDestroy {
  @Input() private onNextExercise: BehaviorSubject<number>;
  @Input() private exercises: ExerciseData[] = [];
  @Input() current: number;
  private componentActive = true;
  exerciseBullets: ExerciseData[];

  ngOnInit() {
    if (this.onNextExercise) {
      this.onNextExercise
      .takeWhile(() => this.componentActive)
      .subscribe(event => {
        this.sliceExercises(event);
      });
    } else {
      this.exerciseBullets = this.exercises;
    }
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
