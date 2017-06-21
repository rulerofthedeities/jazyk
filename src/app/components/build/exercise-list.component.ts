import {Component, Input, Output} from '@angular/core';
import {Exercise} from '../../models/exercise.model';

@Component({
  selector: 'km-exercise-list',
  templateUrl: 'exercise-list.component.html',
  styles: [`
    .move {
      margin-left: 10px;
    }
    .item {
      color: gainsboro ;
      font-size: 20px;
      width: 32px;
    }
    .item.active {
      color: black;
    }
    .word {
      margin-left: 8px;
      font-size: 16px;
    }
  `]
})

export class BuildExerciseListComponent {
  @Input() exercises: Exercise[];
  @Input() lanLocal: string;
  @Input() lanForeign: string;

  onEditExercise(exercise: Exercise) {
    console.log('edit exercise');
  }

  onMoveExercise(exercise: Exercise) {
    console.log('move exercise');
  }
}
