import { Component, Input } from '@angular/core';
import { SentenceData } from 'app/models/revision.model';

@Component({
  selector: 'km-revision-sentences',
  templateUrl: 'book-revision-sentences.component.html',
  styleUrls: ['book-revision-sentences.component.css']
})

export class BookRevisionSentencesComponent {
  @Input() paragraphs: SentenceData[][];
  hoverSentenceParNr: number;
  hoverSentenceLineNr: number;
  translateSentenceParNr: number;
  translateSentenceLineNr: number;

  onHoverSentence(parNr: number, lineNr: number) {
    this.hoverSentenceParNr = parNr;
    this.hoverSentenceLineNr = lineNr;
  }

  onCancelHoverSentence() {
    this.hoverSentenceParNr = null;
    this.hoverSentenceLineNr = null;
  }

  onClickSentence(tpe: string, parNr: number, lineNr: number) {
    if (tpe === 'translation') {
      this.sentenceTranslation(parNr, lineNr);
    } else {
      this.toggleSentence(parNr, lineNr);
    }
  }

  private toggleSentence(parNr: number, lineNr: number) {
    this.hoverSentenceParNr = this.hoverSentenceParNr ? null : parNr;
    this.hoverSentenceLineNr = this.hoverSentenceLineNr ? null : lineNr;
  }

  private sentenceTranslation(parNr: number, lineNr: number) {
    this.translateSentenceParNr = parNr;
    this.translateSentenceLineNr = lineNr;
  }
}
