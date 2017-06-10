import {Component, Input} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {Exercise} from '../../models/exercise.model';

@Component({
  selector: 'km-learn-test',
  template: `
    TEST

    <pre>{{exercises|json}}</pre>
  `
})

export class LearnTestComponent {
  @Input() exercises: Exercise[];
  @Input() lanPair: LanPair[];
}
