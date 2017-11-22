import {Component, Input, OnInit} from '@angular/core';
import {ExerciseData, Direction} from '../../models/exercise.model';

interface Result {
  exercise: ExerciseData;
  isCorrect?: boolean;
  isAlt?: boolean;
  isAlmostCorrect?: boolean;
  points: number;
  streak: string;
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
  <div class="list" *ngIf="noResults">
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
    console.log('completed data', this.data);
    // show only 1 result per word
    let result: Result;
    this.data.forEach(exerciseData => {
      if (exerciseData.data.isDone) {
        // Check if this exercise is already in results
        result = this.results.find(existingResult => existingResult.exercise.exercise._id === exerciseData.exercise._id);
        if (!result) {
          result = {
            exercise: exerciseData,
            isCorrect: exerciseData.data.isCorrect,
            isAlt: exerciseData.data.isAlt,
            isAlmostCorrect: exerciseData.data.isAlmostCorrect,
            points: exerciseData.data.points,
            streak: exerciseData.data.isCorrect ? '1' : exerciseData.data.isAlmostCorrect ? '2' : '0'
          };
          const test = JSON.parse(JSON.stringify(result));
          console.log('adding', test);
          this.results.push(result);
        } else {
          result.isCorrect = exerciseData.data.isCorrect ? result.isCorrect : false;
          result.isAlt = exerciseData.data.isAlt ? true : result.isAlt;
          result.isAlmostCorrect = exerciseData.data.isCorrect ?
            (exerciseData.data.isAlmostCorrect || result.isAlmostCorrect ? true : false) : false;
          result.points += exerciseData.data.points;
          result.streak += exerciseData.data.isCorrect ? '1' : exerciseData.data.isAlmostCorrect ? '2' : '0';
          const test = JSON.parse(JSON.stringify(result));
          console.log('updated', test);
        }
      }
    });
    if (this.results.length === 0) {
      this.noResults = true;
    }
    console.log('completed data results', this.results);
  }
}
