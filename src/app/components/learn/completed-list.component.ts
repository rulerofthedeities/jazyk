import {Component, Input, OnInit} from '@angular/core';
import {ExerciseData, Direction} from '../../models/exercise.model';

interface Result {
  exercise: ExerciseData;
  isCorrect?: boolean;
  isAlt?: boolean;
  isAlmostCorrect?: boolean;
}

@Component({
  selector: 'km-completed-list',
  template: `
  <div class="list" *ngIf="!noResults">
    <div *ngFor="let result of results; let i=index">
      <span 
        class="fa fa-circle" 
        [ngClass]="{
          green: result.isCorrect && !result.isAlt,
          yellow: result.isCorrect && result.isAlt,
          orange: !result.isCorrect && result.isAlmostCorrect,
          red: !result.isCorrect && !result.isAlmostCorrect}">
      </span> {{result.exercise.exercise.foreign.word}} <span class="local">- {{result.exercise.exercise.local.word}}</span>
    </div>
  </div>
  <div *ngIf="noResults">
    {{text["NoWordsLearned"]}}.
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
    }`]
})

export class LearnCompletedListComponent implements OnInit {
  @Input() private data: ExerciseData[];
  @Input() text: Object;
  results: Result[] = [];
  noResults = false;

  ngOnInit() {
    // show only 1 result per word
    let result: Result;
    this.data.forEach(exerciseData => {
      if (exerciseData.data.isDone) {
        // Check if this exercise is already in results
        result = this.results.find(existingResult => existingResult.exercise.exercise.foreign.word === exerciseData.exercise.foreign.word);
        if (!result) {
          result = {
            exercise: exerciseData,
            isCorrect: exerciseData.data.isCorrect,
            isAlt: exerciseData.data.isAlt,
            isAlmostCorrect: exerciseData.data.isAlmostCorrect
          };
          this.results.push(result);
        } else {
          result.isCorrect = exerciseData.data.isCorrect ? result.isCorrect : false;
          result.isAlt = exerciseData.data.isAlt ? true : result.isAlt;
          result.isAlmostCorrect = exerciseData.data.isCorrect ?
            (exerciseData.data.isAlmostCorrect || result.isAlmostCorrect ? true : false) : false;
        }
      }
    });
    if (this.results.length === 0) {
      this.noResults = true;
    }
  }
}
