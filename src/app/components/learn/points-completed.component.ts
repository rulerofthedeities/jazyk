import {Component, Input, OnInit} from '@angular/core';
import {ExerciseData} from '../../models/exercise.model';

@Component({
  selector: 'km-points-completed',
  template: `
  <div class="points">
    TOTAL: {{totalPoints}}
  </div>`,
  styles: [`
    .points {
      font-size: 20px;
      margin-left: 15px;
      margin-bottom: 15px;
    }
  `]
})

export class LearnPointsCompletedComponent implements OnInit {
  @Input() private data: ExerciseData[];
  totalPoints = 0;

  ngOnInit() {
    // add all points
    this.data.forEach(exerciseData => {
      if (exerciseData.data && exerciseData.data.points) {
        this.totalPoints += exerciseData.data.points.fixed();
      }
    });
  }
}
