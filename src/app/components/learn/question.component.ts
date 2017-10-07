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
  @Input() settings: LearnSettings = null;

  getLocalAlts(word: Exercise): string {
    let altwords = '';
    console.log('local', word);
    if (word && word.local && word.local.alt) {
    console.log('local', word.local.alt);
      altwords = word.local.alt.split('|').join(', ');
    }
    console.log('local', altwords);
    return altwords;
  }
}
