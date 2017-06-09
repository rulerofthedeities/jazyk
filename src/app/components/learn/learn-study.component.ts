import {Component, Input} from '@angular/core';
import {Exercise} from '../../models/exercise.model';

@Component({
  selector: 'km-learn-study',
  template: `
    STUDY

    <pre>{{exercises|json}}</pre>
  `
})

export class LearnStudyComponent {
  @Input() exercises: Exercise[];
}
