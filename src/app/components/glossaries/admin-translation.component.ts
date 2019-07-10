import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { TranslationService } from '../../services/translation.service';
import { WordListService } from '../../services/word-list.service';
import { Book } from 'app/models/book.model';
import { Word, WordTranslations, WordTranslation } from 'app/models/word.model';
import { Language } from '../../models/main.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-admin-translation',
  templateUrl: 'admin-translation.component.html',
  styleUrls: ['admin-translation.component.css']
})

export class AdminWordTranslationComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  @Input() targetLan: Language;
  @Input() book: Book;
  @Input() word: Word;
  @Input() translations: WordTranslations;
  @Input() userId: string;
  @Input() i: number;
  @Input() elementNr: number;
  @Input() isEditing = false;
  @Output() newTranslations = new EventEmitter<{translations: WordTranslations, i: number}>();
  @Output() updatedTranslations = new EventEmitter<{translations: WordTranslations, i: number}>();
  @Output() cancelTranslation = new EventEmitter<boolean>();

  private componentActive = true;
  showTranslationForm = false;
  submitting = false;
  duplicate = false;
  translationEdit: string;
  translationNote: string;

  constructor(
    private translationService: TranslationService,
    private wordlistService: WordListService
  ) {}

  ngOnInit() {
    if (this.isEditing) {
      const tl = this.translations.translations[this.elementNr];
      this.translationEdit = tl.translation;
      this.translationNote = tl.definition;
    }
    this.showTranslationForm = this.isEditing;
  }

  onAddTranslation() {
    this.translationEdit = '';
    this.translationNote = '';
    this.showTranslationForm = true;
  }

  onAddUpdateTranslation(translation: string, translationnote: string) {
    this.addUpdateTranslation(translation, translationnote);
  }

  onCancel() {
    this.cancelTranslation.emit(true);
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

    const translations = this.translations.translations;
    const duplicate = translations.find(t => t.translation === translation && t.definition === translationnote);
    if (translation && !duplicate) {
      if (this.isEditing) {
        this.updateTranslation(translation, translationnote);
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

  private updateTranslation(translation: string, note: string) {
    const elementId = this.translations.translations[this.elementNr]._id;
    this.translationService
    .updateWordTranslation(
      this.translations._id,
      elementId,
      translation,
      note)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        this.showTranslationForm = false;
        this.submitting = false;
        this.translations.translations[this.elementNr].translation = translation;
        this.translations.translations[this.elementNr].definition = note;
        console.log('summary', translation, this.wordlistService.createTranslationsSummary(this.translations));
        this.translations.summary = this.wordlistService.createTranslationsSummary(this.translations);
        console.log('updated tl', this.translations);
        this.updatedTranslations.emit({translations: this.translations, i: this.i});
    });
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
        word: this.word.word,
        translations: newTranslations
      },
      i: this.i
    });
    // Save
    this.translationService
    .saveTranslations(this.book.lanCode, this.book._id, this.word, newTranslations)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(result => {
      this.showTranslationForm = false;
      this.submitting = false;
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
