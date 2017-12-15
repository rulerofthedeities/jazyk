import {Component, Input, OnInit} from '@angular/core';
import {ExerciseData} from '../../models/exercise.model';

@Component({
  selector: 'km-points-completed',
  templateUrl: 'points-completed.component.html',
  styleUrls: ['points-completed.component.css']
})

export class LearnPointsCompletedComponent implements OnInit {
  @Input() private data: ExerciseData[];
  @Input() text: Object;
  total = 0;
  points = 0;
  correct = 0;

  ngOnInit() {
    this.data.forEach(exerciseData => {
      if (exerciseData.data && exerciseData.data.points) {
        this.points += exerciseData.data.points.totalmincorrect();
        this.correct += exerciseData.data.points.correct;
      }
    });
    this.total = this.points + this.correct;
  }
}
