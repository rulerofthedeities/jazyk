import {Component, Input} from '@angular/core';
import {ExerciseData, LearnSettings} from '../../models/exercise.model';
import {LanPair} from '../../models/course.model';

@Component({
  selector: 'km-question',
  templateUrl: 'learn-question.component.html',
  styles: [`
    h1 {
      margin-top: 0;
      font-size: 46px;
    }
    .label-annotation {
      background-color: #f3f3f3;
      border: 1px dotted black;
      color: #333;
      margin-right: 3px;
      border-radius: 6px;
    }
  `]
})

export class LearnQuestionComponent {
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Input() currentData: ExerciseData;
  @Input() tpe: string;
  @Input() settings: LearnSettings = null;
}
