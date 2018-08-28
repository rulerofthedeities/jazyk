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

  constructor(
    private readService: ReadService
  ) {}

  onKeyPressed(key: string) {
    switch (key) {
      case 'Enter':
        const translation = this.translation ? this.translation.nativeElement.value.trim() : null;
        if (translation) {
          const translationnote = this.translationnote.nativeElement.value.trim();
          this.addTranslation(translation, translationnote);
        } else {
          this.nextSentence.emit();
        }
      break;
    }
  }
  onAddTranslation(translation: string, translationnote: string) {
    this.addTranslation(translation, translationnote);
  }

  getColor(i: number, isNote: boolean): string {
    const lightness = Math.min(80, (i + 1) * (isNote ? 50 : 10) - 10).toString();
    return 'hsl(200, 0%,' + lightness + '%)';
  }

  getTranslationPlaceHolder(): string {
    const lan = this.userLanCode.toUpperCase();
    return this.text['AddTranslation'].replace('%s', this.text[lan].toUpperCase());
  }

  private addTranslation(translation: string, translationnote: string) {
    this.submitting = true;
    this.duplicate = false;
    translation = translation.trim();
    translationnote = translationnote.trim();
    const duplicate = this.translations.find(t => t.translation === translation);
    if (translation && !duplicate) {
      this.saveTranslation(translation, translationnote);
    } else {
      this.submitting = false;
      if (duplicate) {
        this.duplicate = true;
      }
    }
  }

  private saveTranslation(translation: string, note: string) {
    this.readService
    .addSentenceTranslation(this.bookLanCode, this.userLanCode, this.bookId, this.sentence, translation, note)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        this.submitted = true;
        const newTranslation = {translation, note, lanCode: this.userLanCode, score: 0};
        this.translations.unshift(newTranslation);
        const points = this.getTranslationPoints(newTranslation.translation);
        this.translationAdded.emit(points);
      }
    );
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
