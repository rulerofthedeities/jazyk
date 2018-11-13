import { Component, Input, Output, OnInit, OnDestroy, EventEmitter } from '@angular/core';
import { Map } from '../../models/main.model';
import { SentenceTranslation, TranslatedData, Thumbs } from '../../models/book.model';
import { ReadnListenService } from '../../services/readnlisten.service';
import { takeWhile } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'km-sentence-translations',
  templateUrl: 'book-translation.component.html',
  styleUrls: ['book-translation.component.css']
})

export class BookTranslationComponent implements OnInit, OnDestroy {
  @Input() userId: string;
  @Input() userLanCode: string;
  @Input() bookLanCode: string;
  @Input() text: Object;
  @Input() bookId: string;
  @Input() sentence: string;
  @Input() private answersReceived: Subject<{answers: string, isResults: boolean}>;
  @Input() private newSentence: Subject<string>;
  @Output() translationAdded = new EventEmitter<number>();
  @Output() nextSentence = new EventEmitter();
  private componentActive = true;
  translations: SentenceTranslation[] = [];
  submitting = false;
  submitted = false;
  duplicate = false;
  isEditing: number = null;
  showTranslations = false;
  canThumb = false;
  canEdit = false;
  translationEdit: string;
  translationNote: string;
  submitMsg: string;
  thumbs: Map<Thumbs> = {};
  isDeeplAvailable: boolean;

  constructor(
    private readnListenService: ReadnListenService
  ) {}

  ngOnInit() {
    this.checkMachineTranslationAvailability();
    this.observe();
    this.getSentenceTranslations(this.sentence);
  }

  onKeyPressed(key: string) {
    switch (key) {
      case 'Enter':
        if (this.translationEdit && !this.submitted) {
          this.addUpdateTranslation(this.translationEdit, this.translationNote || '');
        } else {
          this.nextSentence.emit();
        }
      break;
    }
  }

  onAddUpdateTranslation(translation: string, translationnote: string) {
    this.addUpdateTranslation(translation, translationnote);
  }

  onEditTranslation(i: number) {
    this.isEditing = i;
    this.translationEdit = this.translations[i].translation;
    this.translationNote = this.translations[i].note;
    this.submitted = false;
    this.submitting = false;
  }

  onThumb(up: boolean, translation: SentenceTranslation) {
    if (this.canThumb) {
      this.setThumbData(translation);
      if (!this.thumbs[translation.elementId].savingUp && !this.thumbs[translation.elementId].savingDown) {
        if (this.thumbs[translation.elementId].user === up) {
          up = null; // User undid previous click
        }
        this.saveThumb(up, translation);
      }
    }
  }

  onMachineTranslationAdded(translatedData: TranslatedData) {
    console.log('translation data in parent', translatedData);
    // add to translation list
    const newTranslation = this.insertTranslation(translatedData);
  }

  getColor(i: number, isNote: boolean): string {
    if (this.isEditing === i) {
      return 'rgb(66,139,202)';
    } else {
      const lightness = Math.min(80, (i + 1) * (isNote ? 50 : 10) - 10).toString();
      return 'hsl(200, 0%,' + lightness + '%)';
    }
  }

  getTranslationPlaceHolder(): string {
    const lan = this.userLanCode.toUpperCase();
    return this.text['AddTranslation'].replace('%s', this.text[lan].toUpperCase());
  }

  checkIfTranslationPending(): boolean {
    if (this.translationEdit && this.translationEdit.length > 0 && !this.submitted) {
      return true;
    } else {
      return false;
    }
  }

  private setThumbData(translation: SentenceTranslation) {
    if (!this.thumbs[translation.elementId]) {
      this.thumbs[translation.elementId] = {
        nrUp: 0,
        nrDown: 0,
        user: null,
        translationElementId: translation.elementId,
        savingUp: false,
        savingDown: false
      };
    }
  }

  private saveThumb(up: boolean, translation: SentenceTranslation) {
    this.thumbs[translation.elementId].savingDown = !up;
    this.thumbs[translation.elementId].savingUp = up;
    this.readnListenService
    .saveThumb(up,  this.bookId, translation.userId, translation._id, translation.elementId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      thumb => {
        this.thumbs[translation.elementId].savingDown = false;
        this.thumbs[translation.elementId].savingUp = false;
        if (this.thumbs[translation.elementId].user !== up) {
          if (up === true) {
            if (this.thumbs[translation.elementId].user !== true) {
              this.thumbs[translation.elementId].nrUp++;
            }
            if (this.thumbs[translation.elementId].user === false && this.thumbs[translation.elementId].nrDown > 0) { // not null
              this.thumbs[translation.elementId].nrDown--;
            }
          } else if (up === false) {
            if (this.thumbs[translation.elementId].user !== false) {
              this.thumbs[translation.elementId].nrDown++;
            }
            if (this.thumbs[translation.elementId].user === true && this.thumbs[translation.elementId].nrUp > 0) { // not null
              this.thumbs[translation.elementId].nrUp--;
            }
          } else if (up === null) {
            if (this.thumbs[translation.elementId].user === true) {
              this.thumbs[translation.elementId].nrUp--;
            }
            if (this.thumbs[translation.elementId].user === false) {
              this.thumbs[translation.elementId].nrDown--;
            }
          }
          this.thumbs[translation.elementId].user = up;
        }
      }
    );
  }

  private getSentenceTranslations(sentence: string) {
    this.readnListenService
    .fetchSentenceTranslations(
      this.userLanCode,
      this.bookId,
      sentence)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        this.translations = translations;
        if (this.translations.length) {
          this.getTranslationThumbs(this.translations[0]._id);
        }
      }
    );
  }

  private getTranslationThumbs(translationId: string) {
    this.readnListenService
    .fetchThumbs(this.bookId, translationId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (thumbs: Thumbs[]) => {
        thumbs.forEach(thumb => {
          this.thumbs[thumb.translationElementId] = thumb;
        });
      }
    );
  }

  private addUpdateTranslation(translation: string, translationnote: string) {
    this.submitting = true;
    this.duplicate = false;
    translation = translation.trim();
    translationnote = translationnote || '';
    translationnote = translationnote.trim();
    const duplicate = this.translations.find(t => t.translation === translation);
    if (translation && !duplicate) {
      if (this.isEditing === null) {
        this.saveTranslation(translation, translationnote);
      } else {
        this.updateTranslation(translation, translationnote);
      }
    } else {
      this.submitting = false;
      if (duplicate) {
        this.duplicate = true;
      }
    }
  }

  private saveTranslation(translation: string, note: string) {
    this.readnListenService
    .addSentenceTranslation(
      this.bookLanCode,
      this.userLanCode,
      this.bookId,
      this.sentence,
      translation,
      note)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (newTranslationData: TranslatedData) => {
        this.submitMsg = this.text['ThankYouTranslation'] + '!';
        this.submitted = true;
        this.submitting = false;
        const newTranslation = this.insertTranslation(newTranslationData);
        const points = this.getTranslationPoints(newTranslation.translation);
        this.translationAdded.emit(points);
        this.setThumbData(newTranslation);
        this.saveThumb(true, newTranslation);
      }
    );
  }

  private insertTranslation(newTranslationData: TranslatedData) {
    const newTranslation = newTranslationData.translation;
    newTranslation.elementId = newTranslation._id;
    newTranslation._id = newTranslationData.translationsId;
    this.translations.unshift(newTranslation);
    return newTranslation;
  }

  private updateTranslation(translation: string, note: string) {
    this.readnListenService
    .updateSentenceTranslation(
      this.translations[this.isEditing]._id,
      this.translations[this.isEditing].elementId,
      translation,
      note)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        this.submitMsg = '';
        if (result) {
          this.submitMsg = this.text['TranslationUpdated'];
          this.translations[this.isEditing].translation = translation;
          this.translations[this.isEditing].note = note;
        }
        this.submitting = false;
        this.submitted = true;
        this.isEditing = null;
    });
  }

  private getTranslationPoints(translation: string): number {
    let points = 0;
    const wordsTranslation = translation.split(' '),
          wordsSentence = this.sentence.split(' ');
    if (wordsTranslation.length >= wordsSentence.length / 2) {
      points = (wordsTranslation.length + wordsSentence.length) || 0;
    }
    return points * 2;
  }

  private checkMachineTranslationAvailability() {
    // Check if both source and target languages are available in deepl
    const deeplLanguages = this.readnListenService.getMachineLanguages('deepl');
    if (deeplLanguages.includes(this.userLanCode) && deeplLanguages.includes(this.bookLanCode)) {
      this.isDeeplAvailable = true;
    }
  }

  private observe() {
    this.answersReceived
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(answers => {
      this.canThumb = false;
      this.canEdit = false;
      if (answers && answers.answers) {
        const lastAnswer = answers.answers.slice(-1);
        if (lastAnswer === 'y' || lastAnswer === 'm') {
          this.canThumb = true;
          if (lastAnswer !== 'm') {
            this.canEdit = true;
          }
        }
        this.showTranslations = true;
      }
    });
    this.newSentence
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(sentence => {
      if (sentence) {
        // new sentence, get new data
        this.showTranslations = false;
        this.sentence = sentence;
        this.submitting = false;
        this.submitted = false;
        this.duplicate = false;
        this.isEditing = null;
        this.translationEdit = null;
        this.translationNote = null;
        this.submitMsg = null;
        this.getSentenceTranslations(sentence);
      }
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
