import {Component, Input, OnInit} from '@angular/core';
import {ExerciseData} from '../../models/exercise.model';

@Component({
  selector: 'km-points-completed',
  template: `
  <div class="points">
    <table class="table table-bordered">
      <tbody>
        <tr>
          <td>{{text["Words"]}}</td>
          <td class="text-right nr">{{points}}</td>
        </tr>
        <tr>
          <td>{{text["Bonus"]}}</td>
          <td class="text-right nr">{{correct}}</td>
        </tr>
        <tr class="success">
          <td>{{text["Total"]}}</td>
          <td class="text-right nr">
            <div class="total">
              {{total}}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>`,
  styles: [`
    .points {
      font-size: 20px;
      margin-left: 15px;
      margin-bottom: 15px;
    }
    .nr {
      background-color: white;
    }
    .total {
      border: 1px solid black;
      margin: -8px;
      padding: 7px;
    }
  `]
})

export class LearnPointsCompletedComponent implements OnInit {
  @Input() private data: ExerciseData[];
  @Input() text: Object;
  total = 0;
  points = 0;
  correct = 0;

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
