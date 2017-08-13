import {Component, Input, OnInit} from '@angular/core';
import {ExerciseData} from '../../models/exercise.model';

@Component({
  selector: 'km-bullets',
  template: `
    <div class="bullets">
      <span 
        *ngFor="let exercise of exercises; let i=index"
        class="fa"
        [ngClass]="{
          'fa-square-o': i!==current, 
          'fa-square': i===current || exercise.data.isDone, 
          'green': exercise.result || (exercise.data.isDone && exercise.data.isCorrect && !exercise.data.isAlt),
          'yellow': exercise.data.isDone && exercise.data.isCorrect && exercise.data.isAlt,
          'orange': exercise.data.isDone && !exercise.data.isCorrect && exercise.data.isAlmostCorrect,
          'red': exercise.data.isDone && !exercise.data.isCorrect && !exercise.data.isAlmostCorrect}">
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
  `]
})

export class LearnBulletsComponent {
  @Input() exercises: ExerciseData[];
  @Input() current: number;
}
