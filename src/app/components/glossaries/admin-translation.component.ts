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
  @Input() translation: WordTranslation;
  @Input() userId: string;
  @Input() isEditing = false;
  @Output() newTranslations = new EventEmitter<{translations: WordTranslations}>();
  @Output() updatedTranslation = new EventEmitter<{translation: string, note: string, translationId: string}>();
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
      const tl = this.translation;
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
    this.showTranslationForm = false;
    // this.cancelTranslation.emit(true);
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

    let duplicate = false;
    if (this.word.translations && this.word.translations.length) {
      duplicate = !!this.word.translations.find(t => t.translation === translation && t.definition === translationnote);
    }
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
    this.translationService
    .updateWordTranslation(
      this.word._id,
      this.translation._id,
      translation,
      note)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        this.showTranslationForm = false;
        this.submitting = false;
        this.updatedTranslation.emit({translation, note, translationId: this.translation._id});
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
    // Save
    this.translationService
    .saveTranslations(this.book.lanCode, this.book._id, this.word, newTranslations)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(result => {
      newTranslations[0]._id = result._id;
      this.newTranslations.emit({
        translations: {
          lanCode: this.book.lanCode,
          word: this.word.word,
          translations: newTranslations
        }
      });
      this.showTranslationForm = false;
      this.submitting = false;
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
