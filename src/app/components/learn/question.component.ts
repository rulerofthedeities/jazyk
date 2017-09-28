import {Component, Input} from '@angular/core';
import {ExerciseData} from '../../models/exercise.model';
import {LearnSettings} from '../../models/user.model';
import {LanPair} from '../../models/course.model';

@Component({
  selector: 'km-question',
  templateUrl: 'question.component.html',
  styleUrls: ['question.component.css']
})

export class LearnQuestionComponent {
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Input() currentData: ExerciseData;
  @Input() dir: string;
  @Input() settings: LearnSettings = null;
}
