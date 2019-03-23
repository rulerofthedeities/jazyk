import { Component, Input, OnChanges } from '@angular/core';
import { Sentence, AudioSentence } from '../../models/book.model';
import { awsPath } from '../../services/shared.service';
import { ReadnListenService } from '../../services/readnlisten.service';

@Component({
  selector: 'km-sentence',
  templateUrl: 'sentence.component.html',
  styleUrls: ['sentence.component.css']
})

export class SentenceComponent implements OnChanges {
  @Input() sentence: Sentence;
  @Input() audioSentence: AudioSentence = null; // Audio for read, ignored for listen
  @Input() bookType: string;
  @Input() directory: string;
  @Input() lanCode: string;
  @Input() showSentence: boolean;
  awsPath = awsPath;
  text: string;
  s3: string;

  constructor(
    private readnListenService: ReadnListenService
  ) {}

  ngOnChanges() {
    console.log('audio sentence', this.audioSentence, this.lanCode);
    this.text = this.sentence.text.trim();
    if (this.audioSentence && this.audioSentence.text && this.audioSentence.text.trim() === this.text && this.audioSentence.s3) {
      this.s3 = this.audioSentence.s3;
      console.log('audio sentence ok', this.audioSentence.s3);
    } else {
      this.s3 = null;
    }
  }

  onAudioEnded(isEnded: boolean) {
    this.readnListenService.audioHasEnded(isEnded);
  }
}
