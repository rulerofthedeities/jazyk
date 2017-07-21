import {Component, Input} from '@angular/core';
import {ExerciseData} from '../../models/exercise.model';

@Component({
  selector: 'km-bullets',
  template: `
    <div class="bullets">
      <span 
        *ngFor="let exercise of data; let i=index"
        class="fa"
        [ngClass]="{
          'fa-square-o': !isCurrent(i), 
          'fa-square': isCurrent(i) || isWordDone(i), 
          'green': isWordCorrect(i),
          'red': !isWordCorrect(i) && isWordDone(i)}">
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
  @Input() data: ExerciseData;
  @Input() current: number;

  isCurrent(i: number): boolean {
    return this.current === i;
  }

  isWordDone(i: number): boolean {
    return this.data[i].data.isDone;
  }

  isWordCorrect(i: number): boolean {
    let isCorrect: boolean;
    let data: ExerciseData;
    if (i >= 0) {
      data = this.data[i];
    } else {
      data = this.data[this.current];
    }
    isCorrect = data.data.isCorrect;
    return isCorrect;
  }
}
