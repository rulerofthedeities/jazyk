import {Component, Input} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {Exercise} from '../../models/exercise.model';

@Component({
  selector: 'km-learn-practise',
  template: `
    PRACTISE

    <pre>{{exercises|json}}</pre>
  `
})

export class LearnPractiseComponent {
  @Input() exercises: Exercise[];
  @Input() lanPair: LanPair[];
}
