import {Component, Input, ViewEncapsulation} from '@angular/core';
import {Dialogue, LanPair} from '../../models/course.model';

@Component ({
  selector: 'km-learn-dialogue',
  templateUrl: 'dialogue.component.html',
  styleUrls: ['dialogue.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class LearnDialogueComponent {
  @Input() dialogue: Dialogue;
  @Input() languagePair: LanPair;
  selectedLine: number = null;

  onSelectLine(lineNr: number) {
    this.selectedLine = lineNr;
  }

  onDeSelectLine() {
    this.selectedLine = null;
  }
}