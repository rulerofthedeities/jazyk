import { Component, Input, OnChanges } from '@angular/core';
import { Sentence } from '../../models/book.model';
import { awsPath } from '../../services/shared.service';
import { ReadnListenService } from '../../services/readnlisten.service';

@Component({
  selector: 'km-sentence',
  templateUrl: 'sentence.component.html',
  styleUrls: ['sentence.component.css']
})

export class SentenceComponent implements OnChanges {
  @Input() sentence: Sentence;
  @Input() bookType: string;
  @Input() directory: string;
  @Input() lanCode: string;
  @Input() showSentence: boolean;
  awsPath = awsPath;

  constructor(
    private readnListenService: ReadnListenService
  ) {}

  ngOnChanges() {
  }

  onAudioEnded(isEnded: boolean) {
    this.readnListenService.audioHasEnded(isEnded);
  }
}
