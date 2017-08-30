import {Component, Input} from '@angular/core';
import {ExerciseData} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-bullets',
  templateUrl: 'bullets.component.html',
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
    .bullets span.fix {
      margin-left: -3px;
    }
  `]
})

export class LearnBulletsComponent {
  @Input() exercises: ExerciseData[];
  @Input() current: number;
}
