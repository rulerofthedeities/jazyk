import {Component, Input, Output} from '@angular/core';
import {LanPair} from '../../models/course.model';
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
  @Input() languagePair: LanPair;
  @Input() lessonId: string;
  @Input() text: Object;
  editing = null;

  onEditExercise(i: number) {
    this.editing = i === this.editing ? null : i;
  }

  onMoveExercise(i: number) {
    console.log('move exercise');
  }
}
