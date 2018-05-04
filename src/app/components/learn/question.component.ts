import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {ExerciseData, Exercise} from '../../models/exercise.model';
import {LearnSettings} from '../../models/user.model';
import {LanPair} from '../../models/course.model';
import {Subject} from 'rxjs/Subject';

@Component({
  selector: 'km-question',
  templateUrl: 'question.component.html',
  styleUrls: ['question.component.css']
})

export class LearnQuestionComponent implements OnInit, OnDestroy {
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Input() currentData: ExerciseData;
  @Input() dir: string;
  @Input() showAlt = false;
  @Input() hideGenus = false;
  @Input() showAnnotations = true;
  @Input() settings: LearnSettings = null;
  @Input() private onHasAnswered: Subject<boolean>;
  @Input() private onNextWord: Subject<boolean>;
  private componentActive = true;
  hasAnswered = false;

  ngOnInit() {
    //check if question has been answered
    this.onHasAnswered
    .takeWhile(() => this.componentActive)
    .subscribe(event => {
      console.log('has answered');
      this.hasAnswered = true;
    });
    this.onNextWord
    .takeWhile(() => this.componentActive)
    .subscribe(event => {
      console.log('next word');
      this.hasAnswered = false;
    });
  }

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
    let showGenusColor = false;
    if (!this.hideGenus) {
      showGenusColor = this.settings ? this.settings.color : true;
    }
    return showGenusColor;
  }

  showGenus(genus: string): boolean {
    // Toon genus niet indien meerdere waarden mogelijk zijn
      console.log('genus', genus);
    if (genus) {
      const showGenusColor = this.settings ? this.settings.color : true;
      console.log('show genus color', showGenusColor);
      if (!showGenusColor) {
        return genus.indexOf(';') > -1 ? false : true;
      }
    } else {
      return false;
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
