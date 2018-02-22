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
  @Input() text: Object;
  @Input() slice = true;
  private componentActive = true;
  exerciseBullets: ExerciseData[];
  toGo: number;

  ngOnInit() {
    this.exerciseBullets = this.exercises;
    this.checkBulletsUpdated();
  }

  private sliceExercises(i: number) {
    if (this.slice && this.exercises && this.exercises.length > 0) {
      this.exerciseBullets = this.exercises.slice(0, i + 1);
    }
  }

  private checkBulletsUpdated() {
    this.onNextExercise
    .takeWhile(() => this.componentActive)
    .subscribe(event => {
      this.sliceExercises(event);
      this.countDifferentExercises();
    });
  }

  private countDifferentExercises() {
    if (this.exercises) {
      this.toGo = this.exercises.filter(exercise => exercise.data.isDone === false).length;
    }
    console.log('Bullet exercises to go', this.toGo);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
