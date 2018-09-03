import { Component, Input, Output, OnDestroy, EventEmitter, ViewChild } from '@angular/core';
import { SentenceTranslation } from '../../models/book.model';
import { ReadService } from '../../services/read.service';
import { takeWhile } from 'rxjs/operators';


@Component({
  selector: 'km-sentence-translations',
  templateUrl: 'book-translation.component.html',
  styleUrls: ['book-translation.component.css']
})

export class BookTranslationComponent implements OnDestroy {
  @Input() userId: string;
  @Input() translations: SentenceTranslation[] = [];
  @Input() answer: string;
  @Input() userLanCode: string;
  @Input() bookLanCode: string;
  @Input() text: Object;
  @Input() bookId: string;
  @Input() sentence: string;
  @Output() translationAdded = new EventEmitter<number>();
  @Output() nextSentence = new EventEmitter();
  @ViewChild('translation') translation;
  @ViewChild('translationnote') translationnote;

  private componentActive = true;
  submitting = false;
  submitted = false;
  duplicate = false;
  isEditing = null;
  translationEdit: string;
  translationNote: string;
  submitMsg: string;

  constructor(
    private readService: ReadService
  ) {}

  onKeyPressed(key: string) {
    switch (key) {
      case 'Enter':
        const translation = this.translation ? this.translation.nativeElement.value.trim() : null;
        if (translation) {
          const translationnote = this.translationnote.nativeElement.value.trim();
          this.addUpdateTranslation(translation, translationnote);
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

  private addUpdateTranslation(translation: string, translationnote: string) {
    this.submitting = true;
    this.duplicate = false;
    translation = translation.trim();
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

  ngOnDestroy() {
    this.componentActive = false;
  }
}
