import {Component, Input} from '@angular/core';
import {ExerciseType} from '../../models/exercise.model';

@Component({
  selector: 'km-type-icons',
  template: `
    <span class="fa fa-spacing"
      [ngClass]="{
        'fa-font': tpe === exType.Word,
        'fa-puzzle-piece': tpe !== exType.Word
      }"
      [tooltip]="getToolTip(tpe)"
      [tooltipPlacement]="'top'">
    </span>`
})

export class TypeIconsComponent {
  @Input() tpe: ExerciseType;
  @Input() text: Object;
  exType = ExerciseType;

  getToolTip(tpe: number): string {
    let key: string;
    switch(tpe) {
      case ExerciseType.Article:
        key = 'Article';
      break;
      case ExerciseType.Comparison:
        key = 'Comparison';
      break;
      case ExerciseType.Conjugations:
        key = 'Conjugations';
      break;
      case ExerciseType.FillIn:
        key = 'FillIn';
      break;
      case ExerciseType.Genus:
        key = 'Genus';
      break;
      case ExerciseType.QA:
        key = 'QA';
      break;
      case ExerciseType.Select:
        key = 'Select';
      break;
      case ExerciseType.Word:
        key = 'Word';
      break;
    }
    return key ? this.text[key] : '';
  }
}

            