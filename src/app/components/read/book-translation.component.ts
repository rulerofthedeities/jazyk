import { Component, Input, Output, OnInit, OnDestroy, EventEmitter } from '@angular/core';
import { SentenceTranslation } from '../../models/book.model';
import { ReadService } from '../../services/read.service';
import { takeWhile } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface Thumbs {
  up: number;
  down: number;
  thumb: string;
  savingUp: boolean; // clicked up, saving now
  savingDown: boolean; // clicked down, saving now
}

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
  lastAnswer: string;
  translationEdit: string;
  translationNote: string;
  submitMsg: string;
  thumbs: Thumbs[] = [];

  constructor(
    private readService: ReadService
  ) {}

  ngOnInit() {
    this.observe();
    this.getSentenceTranslations(this.sentence);
  }

  onKeyPressed(key: string) {
    switch (key) {
      case 'Enter':
        if (this.translationEdit) {
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
    if (!this.thumbs[0].savingUp && !this.thumbs[0].savingDown) {
      this.saveThumb(up, translation);
      this.thumbs[0].thumb = up ? 'up' : 'down'; // do this after successful thumb
    }
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

  private saveThumb(up: boolean, translation: SentenceTranslation) {
    this.thumbs[0].savingDown = !up;
    this.thumbs[0].savingUp = up;
    this.readService
    .saveThumb(up,  this.bookId, translation._id, translation.elementId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      thumb => {
        this.thumbs[0].savingDown = false;
        this.thumbs[0].savingUp = false;
      }
    );
  }

  private getSentenceTranslations(sentence: string) {
    this.readService
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
    this.readService
    .fetchThumbs(this.bookId, translationId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      thumbs => {
        // console.log('thumbs', thumbs);
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
    this.readService
    .addSentenceTranslation(
      this.bookLanCode,
      this.userLanCode,
      this.bookId,
      this.sentence,
      translation,
      note)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        this.submitMsg = this.text['ThankYouTranslation'] + '!';
        this.submitted = true;
        this.submitting = false;
        const newTranslation = {
          translation,
          note,
          lanCode: this.userLanCode,
          score: 0,
          userId: this.userId
        };
        this.translations.unshift(newTranslation);
        const points = this.getTranslationPoints(newTranslation.translation);
        this.translationAdded.emit(points);
      }
    );
  }

  private updateTranslation(translation: string, note: string) {
    this.readService
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
    return points;
  }

  private observe() {
    this.answersReceived
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(answers => {
      if (answers && answers.answers) {
        this.lastAnswer = answers.answers.slice(-1);
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
