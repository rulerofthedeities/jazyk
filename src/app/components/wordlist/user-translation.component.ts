import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { TranslationService } from '../../services/translation.service';
import { Book } from 'app/models/book.model';
import { WordTranslations, WordTranslation } from 'app/models/word.model';
import { Language } from '../../models/main.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-user-translation',
  templateUrl: 'user-translation.component.html',
  styleUrls: ['user-translation.component.css']
})

export class UserWordTranslationComponent implements OnDestroy {
  @Input() text: Object;
  @Input() targetLan: Language;
  @Input() book: Book;
  @Input() word: string;
  @Input() translations: WordTranslations;
  @Input() userId: string;
  @Input() i: number;
  @Output() newTranslations = new EventEmitter<{translations: WordTranslations, i: number}>();

  private componentActive = true;
  showTranslationForm = false;
  isEditing = false;
  submitting = false;
  duplicate = false;
  translationEdit: string;
  translationNote: string;

  constructor(
    private translationService: TranslationService
  ) {}

  onAddTranslation() {
    this.translationEdit = '';
    this.translationNote = '';
    this.showTranslationForm = true;
    console.log('add translation');
  }

  onAddUpdateTranslation(translation: string, translationnote: string) {
    this.addUpdateTranslation(translation, translationnote);
  }

  getTranslationPlaceHolder(): string {
    const lan = this.targetLan.code.toUpperCase();
    if (this.text[lan]) {
      return this.text['AddTranslation'].replace('%s', this.text[lan].toUpperCase());
    } else {
      return '';
    }
  }

  private addUpdateTranslation(translation: string, translationnote: string) {
    this.submitting = true;
    this.duplicate = false;
    translation = translation.trim();
    translationnote = translationnote || '';
    translationnote = translationnote.trim();

    console.log('translations', this.translations);
    const translations = this.translations.translations;
    const duplicate = translations.find(t => t.translation === translation && t.definition === translationnote);
    console.log('duplicate', duplicate);
    if (translation && !duplicate) {
      if (this.isEditing) {
        // this.updateTranslation(translation, translationnote);
      } else {
        this.saveTranslation(translation, translationnote);
      }
    } else {
      this.submitting = false;
      if (duplicate) {
        this.duplicate = true;
      }
    }
  }

  private saveTranslation(translation: string, note: string) {
    const newTranslations: WordTranslation[] = [{
      translation: translation,
      definition: note,
      lanCode: this.targetLan.code,
      source: 'Jazyk',
      userId: this.userId
    }];
    this.newTranslations.emit({
      translations: {
        lanCode: this.book.lanCode,
        word: this.word,
        translations: newTranslations
      },
      i: this.i
    });
    // Save
    console.log('saving translations', this.book.lanCode, this.word, newTranslations);
    this.translationService
    .saveTranslations(this.book.lanCode, this.book._id, this.word, newTranslations)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(result => {
      this.showTranslationForm = false;
      this.submitting = false;
      console.log('translation saved', result);
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
