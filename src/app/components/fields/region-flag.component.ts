import {Component, Input} from '@angular/core';
import {ExerciseWord} from '../../models/exercise.model';

@Component({
  selector: 'km-region-flag',
  template: `
    <img
      src="/assets/img/flags/{{getRegion()}}.png"
      class="flag"
      [class.thumb]="thumb" *ngIf="lan">
  `,
  styles: [`
    .thumb {
      width: 20px;
      height: 13px;
    }
  `]
})

export class RegionFlagComponent {
  @Input() lan: string; // default lan for flag
  @Input() word: ExerciseWord;
  @Input() thumb = false;

  getRegion() {
    if (this.word && this.word.region) {
      return this.word.region;
    } else {
      return this.lan;
    }
  }
}
