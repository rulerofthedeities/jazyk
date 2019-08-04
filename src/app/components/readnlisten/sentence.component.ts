import { Component, Input, OnChanges } from '@angular/core';
import { Sentence, AudioSentence } from '../../models/book.model';
import { SentenceWord, WordPosition, Word, File } from '../../models/word.model';
import { awsPath } from '../../services/shared.service';
import { ReadnListenService } from '../../services/readnlisten.service';

interface Position {
  wordId: string;
  word: Word;
  translations: string;
  start?: number;
  end: number;
}

interface SentenceSection {
  translations?: string;
  word?: Word;
  text: string;
  wordId: string;
}

@Component({
  selector: 'km-sentence',
  templateUrl: 'sentence.component.html',
  styleUrls: ['sentence.component.css']
})

export class SentenceComponent implements OnChanges {
  @Input() text: Object = null;
  @Input() sentence: Sentence;
  @Input() audioSentence: AudioSentence = null; // Audio for read, ignored for listen
  @Input() bookType: string;
  @Input() directory: string;
  @Input() lanCode: string;
  @Input() lanToCode = '';
  @Input() showSentence: boolean;
  @Input() sentenceWords: SentenceWord = null;
  awsPath = awsPath;
  txt: string;
  s3: string;
  hasWords = false;
  sentenceSections: SentenceSection[];
  selected = null; // Selected translation popup

  constructor(
    private readnListenService: ReadnListenService
  ) {}

  ngOnChanges() {
    this.txt = this.sentence.text.trim();
    this.setS3();
    this.setWordTranslations();
  }

  onAudioEnded(isEnded: boolean) {
    this.readnListenService.audioHasEnded(isEnded);
  }

  onSelectWord(event: MouseEvent, i: number) {
    event.stopPropagation();
    this.selected = i === this.selected ? null : i;
  }

  private setS3() {
    if (this.audioSentence && this.audioSentence.text && this.audioSentence.text.trim() === this.txt && this.audioSentence.s3) {
      this.s3 = this.audioSentence.s3;
    } else {
      this.s3 = null;
    }
  }

  private setWordTranslations() {
    this.hasWords = false;
    if (this.sentenceWords && this.sentenceWords.text && this.txt === this.sentenceWords.text.trim()) {
      if (this.sentenceWords.words && this.sentenceWords.words.length) {
        this.sentenceSections = [];
        // Put all positions in one array
        const positions: Position[] = [],
              wordPositions: WordPosition[] = this.sentenceWords.words;
        wordPositions.forEach(w => {
          w.locations.forEach(p => {
            if (!positions[p.start]) {
              positions[p.start] = {
                wordId: w.wordId,
                translations: w.translations ? w.translations.replace(/\|/g, ', ') : '',
                word: w.word,
                start: p.start,
                end: p.end
              };
            }
          });
        });

        // go through each wordPosition
        // Split up sentence according to start and end of positions
        let sentencePos = 0;
        const text = this.sentence.text;
        positions.forEach(p => {
          if (p && p.start >= sentencePos) {
            if (p.start > sentencePos) {
              // Add previous section
              this.sentenceSections.push({
                text: text.substring(sentencePos, p.start),
                wordId: null
              });
            }
            // Add word section
            this.sentenceSections.push({
              text: text.substring(p.start, p.end + 1),
              wordId: p.wordId,
              word: p.word,
              translations: p.translations || ''
            });
            sentencePos = p.end + 1;
          }
        });
        // Add trailing section
        if (sentencePos < text.length) {
          this.sentenceSections.push({
            text: text.substring(sentencePos, text.length),
            wordId: null
          });
        }
        this.hasWords = true;
      }
    }
  }
}
