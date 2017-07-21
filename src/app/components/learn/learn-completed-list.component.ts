import {Component, Input} from '@angular/core';
import {ExerciseData, Direction} from '../../models/exercise.model';

@Component({
  selector: 'km-completed-list',
  template: `
  <div class="list">
    <div *ngFor="let exercise of data; let i=index">
      <div *ngIf="showWord(exercise)">
        <span 
          class="fa fa-circle" 
          [ngClass]="{green: exercise.data.isCorrect, red: !exercise.data.isCorrect}">
        </span> {{exercise.exercise.foreign.word}} <span class="local">- {{exercise.exercise.local.word}}</span>
      </div>
    </div>
  </div>`,
  styles: [`
    .list {
      margin-left: 12px;
      margin-bottom: 24px;
      font-size: 20px;
      line-height: 32px;
    }
    .studiedLocal {
      color: #999;
    }
    .green {
      color: green;
    }
    .red {
      color: red;
    }`]
})

export class LearnCompletedListComponent {
  @Input() data: ExerciseData[];

  showWord(exercise: ExerciseData): boolean {
    let show = false;
    if (exercise.data.answered < 1 && exercise.data.direction === Direction.ForeignToLocal) {
      show = true;
    }
    return show;
  }
}
