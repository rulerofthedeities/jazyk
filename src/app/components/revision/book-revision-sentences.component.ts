import { Component, Input } from '@angular/core';
import { SentenceData } from 'app/models/revision.model';

@Component({
  selector: 'km-revision-sentences',
  templateUrl: 'book-revision-sentences.component.html',
  styleUrls: ['book-revision-sentences.component.css']
})

export class BookRevisionSentencesComponent {
  @Input() sentences: SentenceData[];
  hoverSentence: number;
  translateSentence: number;

  onHoverSentence(i: number) {
    this.hoverSentence = i;
  }

  onToggleSentence(i: number) {
    this.hoverSentence = this.hoverSentence ? null : i;
  }

  onCancelHoverSentence() {
    this.hoverSentence = null;
  }

  onSentenceTranslation(i: number) {
    this.translateSentence = i;
  }
}
