import { Component, Input, OnChanges, Renderer2, OnDestroy } from '@angular/core';
import { Sentence, AudioSentence } from '../../models/book.model';
import { SentenceWord, WordPosition, Word, SentencePosition, SentenceSection } from '../../models/word.model';
import { awsPath } from '../../services/shared.service';
import { PlatformService } from '../../services/platform.service';
import { SharedService } from '../../services/shared.service';
import { WordListService } from '../../services/word-list.service';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-sentence',
  templateUrl: 'sentence.component.html',
  styleUrls: ['sentence.component.css']
})

export class SentenceComponent implements OnChanges, OnDestroy {
  @Input() text: Object = null;
  @Input() sentence: Sentence;
  @Input() bookId: string;
  @Input() audioSentence: AudioSentence = null; // Audio for read, ignored for listen
  @Input() bookType: string;
  @Input() directory: string;
  @Input() lanCode: string;
  @Input() lanToCode = '';
  @Input() showSentence: boolean;
  @Input() sentenceWords: SentenceWord = null;
  private componentActive = true;
  awsPath = awsPath;
  txt: string;
  s3: string;
  hasWords = false;
  sentenceSections: SentenceSection[];
  selected: number = null; // Selected translation popup
  wordType: string;

  constructor(
    private platform: PlatformService,
    private sharedService: SharedService,
    private wordListService: WordListService,
    renderer: Renderer2
  )  {
    if (this.platform.isBrowser) {
      renderer.listen(document, 'click', (event) => {
        // clicked, close popup
        this.selected = null;
      });
    }
  }

  ngOnChanges() {
    this.txt = this.sentence.text.trim();
    this.selected = null;
    this.setS3();
    this.setWordTranslations();
  }

  onAudioEnded(isEnded: boolean) {
    this.sharedService.audioHasEnded(isEnded);
  }

  onSelectWord(event: MouseEvent, i: number) {
    event.stopPropagation();
    this.selected = i === this.selected ? null : i;
  }

  onAddToMyGlossary(event: MouseEvent, section: SentenceSection) {
    event.stopPropagation();
    const word = section.word;
    if (word && this.lanToCode) {
      let translationSummary: string;
      if (word.translationSummary) {
        translationSummary = word.translationSummary[this.lanToCode];
      }
      word.lanCode = this.lanCode;
      word.targetLanCode = this.lanToCode;

      this.wordListService
      .pinWord(word, this.bookId, translationSummary, true)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        pinned => {
          section.pinned = pinned;
        }
      );
    }
  }

  hasVerbProperty(word: Word): boolean {
    if (word && word.wordType === 'verb' && (word.aspect || word.transitivity)) {
        return true;
    } else {
      return false;
    }
  }

  getVerbProperties(word: Word): string {
    let properties = '';
    if (word) {
      const propertyArr = [];
      if (word.aspect) {
        propertyArr.push(this.text[word.aspect]);
      }
      if (word.transitivity) {
        propertyArr.push(this.text[word.transitivity]);
      }
      properties = propertyArr.join(', ');
    }
    return properties;
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
        const positions: SentencePosition[] = [],
              wordPositions: WordPosition[] = this.sentenceWords.words;
        wordPositions.forEach(w => {
          w.locations.forEach(p => {
            if (!positions[p.start]) {
              positions[p.start] = {
                wordId: w.wordId,
                translations: w.translations ? w.translations.replace(/\|/g, ', ') : '',
                word: w.word,
                actualNotes: w.actual && w.actual.note ? w.actual.note.split('|') : [],
                start: p.start,
                end: p.end,
                notes: w.notes && w.notes.length ? w.notes.split('|') : [],
                pinned: w.pinned
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
            // Create notes for actual word
            const actualNotes: string[] = [];
            p.actualNotes.forEach(note => {
              const tl = this.text['note-' + note];
              if (tl) {
                actualNotes.push(tl);
              }
            });
            // actualNotes.unshift(this.text[p.word.wordType]);
            this.wordType = this.text[p.word.wordType];
            // Create notes for word
            const notes: string[] = [];
            p.notes.forEach(note => {
              const tl = this.text['note-' + note];
              if (tl) {
                notes.push(tl);
              }
            });
            // Add word section
            this.sentenceSections.push({
              text: text.substring(p.start, p.end + 1),
              wordId: p.wordId,
              word: p.word,
              translations: p.translations || '',
              actualNotes: actualNotes.join(', '),
              notes: notes.join(', '),
              pinned: p.pinned
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

  ngOnDestroy() {
    this.componentActive = false;
  }
}
