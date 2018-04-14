import {Component, Input} from '@angular/core';
import {ExerciseData, Exercise} from '../../models/exercise.model';
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
  @Input() showAlt = false;
  @Input() hideGenus = false;
  @Input() showAnnotations = true;
  @Input() settings: LearnSettings = null;

  getAlts(tpe: string, word: Exercise): string {
    let altwords = '';
    if (this.showAlt) {
      if (word && word[tpe] && word[tpe].alt) {
        altwords = word[tpe].alt.split('|').join(', ');
      }
    }
    return altwords;
  }

  getRegion(tpe: string) {
    if (this.currentData.exercise[tpe].region) {
      return this.currentData.exercise[tpe].region;
    } else {
      return tpe === 'foreign' ? this.lanPair.to : this.lanPair.from;
    }
  }

  showGenusColor(): boolean {
    let showGenus = false;
    if (!this.hideGenus) {
      showGenus = this.settings ? this.settings.color : true;
    }
    return showGenus;
  }

  showGenus(genus: string): boolean {
    // Toon genus niet indien meerdere waarden mogelijk zijn
    return genus.indexOf(';') > -1 ? false : true;
  }
}
