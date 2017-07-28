import {Component, Input, OnInit} from '@angular/core';
import {ExerciseData, Direction} from '../../models/exercise.model';

interface Result {
  exercise: ExerciseData;
  isCorrect?: boolean;
}

@Component({
  selector: 'km-completed-list',
  template: `
  <div class="list">
    <div *ngFor="let result of results; let i=index">
      <span 
        class="fa fa-circle" 
        [ngClass]="{green: result.isCorrect, red: !result.isCorrect}">
      </span> {{result.exercise.exercise.foreign.word}} <span class="local">- {{result.exercise.exercise.local.word}}</span>
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

export class LearnCompletedListComponent implements OnInit {
  @Input() private data: ExerciseData[];
  results: Result[] = [];

  ngOnInit() {
    // filter only those answered < 1
    // for each direction, store if correct
    // Only show one direction
    let result: Result;
    this.data.forEach(exerciseData => {
      if (exerciseData.data.answered < 1) {
        // Check if this exercise is already in results
        result = this.results.find(existingResult => existingResult.exercise.exercise.foreign.word === exerciseData.exercise.foreign.word);

        if (!result) {
          result = {
            exercise: exerciseData,
            isCorrect: exerciseData.data.isCorrect
          };
          this.results.push(result);
        } else {
          result.isCorrect = exerciseData.data.isCorrect ? result.isCorrect : false;
        }
      }
    });
  }
}
