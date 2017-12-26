import {Component, Input} from '@angular/core';
import {ExerciseWord} from '../../models/exercise.model';

@Component({
  selector: 'km-region-flag',
  template: `
    <img src="/assets/img/flags/{{getRegion()}}.png" class="flag">
  `
})

export class RegionFlagComponent {
  @Input() lan: string; // default lan for flag
  @Input() word: ExerciseWord;

  getRegion() {
    if (this.word && this.word.region) {
      return this.word.region;
    } else {
      return this.lan;
    }
  }

}