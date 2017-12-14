import {Component, Input, OnInit} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {ExerciseData} from '../../models/exercise.model';

@Component({
  selector: 'km-points-completed',
  template: `
  <div class="points">
    EXERCISES: {{points}}
    BONUS: {{correct}}
            --------
    TOTAL: {{total}}
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
  total = 0;
  points = 0;
  correct = 0;

  constructor(
    private learnService: LearnService
  ) {}

  ngOnInit() {
    // add all points
    console.log('ALL POINTS CALCULATION');
    this.data.forEach(exerciseData => {
      if (exerciseData.data && exerciseData.data.points) {
        this.points += exerciseData.data.points.totalmincorrect();
        this.correct += exerciseData.data.points.correct;
      }
    });
    this.total = this.points + this.correct;
  }
}
