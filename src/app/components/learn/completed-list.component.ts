import {Component, Input, OnInit} from '@angular/core';
import {ExerciseData, ExerciseType, Direction, Points} from '../../models/exercise.model';

interface Result {
  exercise: ExerciseData;
  isCorrect?: boolean;
  isAlt?: boolean;
  isAlmostCorrect?: boolean;
  points: number;
  streak: string;
  tpe: number;
}

@Component({
  selector: 'km-completed-list',
  templateUrl: 'completed-list.component.html',
  styleUrls: ['lesson-overview.component.css', 'completed-list.component.css']
})

export class LearnCompletedListComponent implements OnInit {
  @Input() private data: ExerciseData[];
  @Input() text: Object;
  results: Result[] = [];
  noResults = false;
  exType = ExerciseType;

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
            points: exerciseData.data.points.fixed(),
            streak: exerciseData.data.isCorrect ? '1' : exerciseData.data.isAlmostCorrect ? '2' : '0',
            tpe: exerciseData.exercise.tpe
          };
          const test = JSON.parse(JSON.stringify(result));
          console.log('adding', test);
          this.results.push(result);
        } else {
          result.isCorrect = exerciseData.data.isCorrect ? result.isCorrect : false;
          result.isAlt = exerciseData.data.isAlt ? true : result.isAlt;
          result.isAlmostCorrect = exerciseData.data.isCorrect ?
            (exerciseData.data.isAlmostCorrect || result.isAlmostCorrect ? true : false) : false;
          result.points += exerciseData.data.points.fixed();
          result.streak += exerciseData.data.isCorrect ? '1' : exerciseData.data.isAlmostCorrect ? '2' : '0';
          result.tpe = exerciseData.exercise.tpe;
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
