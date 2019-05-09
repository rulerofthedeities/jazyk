import { Component, Input, Output, OnInit, OnDestroy, EventEmitter } from '@angular/core';
import { Map } from '../../models/main.model';
import { SentenceTranslation, TranslatedData, Thumbs } from '../../models/book.model';
import { ReadnListenService } from '../../services/readnlisten.service';
import { TranslationService } from '../../services/translation.service';
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
  @Input() translations: SentenceTranslation[] = []; // optional
  @Input() text: Object;
  @Input() bookId: string;
  @Input() chapterSequence: number;
  @Input() sentence: string;
  @Input() isRevision = false;
  @Input() private answersReceived: Subject<{answers: string, isResults: boolean}>;
  @Input() private newSentence: Subject<string>;
  @Output() translationAdded = new EventEmitter<number>();
  @Output() nextSentence = new EventEmitter();
  @Output() confirm = new EventEmitter();
  private componentActive = true;
  submitting = false;
  submitted = false;
  duplicate = false;
  isEditing: number = null;
  showTranslations = false;
  canThumb = false;
  canEdit = false;
  canConfirm = false;
  translationEdit: string;
  translationNote: string;
  submitMsg: string;
  thumbs: Map<Thumbs> = {};
  isDeeplAvailable: boolean;
  hasDeeplTranslations: boolean;
  hasMSTranslations: boolean;
  isLoading = true;

  constructor(
    private translationService: TranslationService,
    private readnListenService: ReadnListenService
  ) {}

  ngOnInit() {
    this.setElementTranslationIds(); // revision translations don't have elementId
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
    // add to translation list
    const newTranslation = this.insertTranslation(translatedData);
    if (newTranslation && newTranslation.machine === 'deepl') {
      this.hasDeeplTranslations = true;
    }
    if (newTranslation && newTranslation.machine === 'microsoft') {
      this.hasMSTranslations = true;
    }
    if (this.canConfirm) {
      this.confirm.next();
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
    if (this.text[lan]) {
      return this.text['AddTranslation'].replace('%s', this.text[lan].toUpperCase());
    } else {
      return '';
    }
  }

  checkIfTranslationPending(): boolean {
    if (this.translationEdit && this.translationEdit.length > 0 && !this.submitted) {
      return true;
    } else {
      return false;
    }
  }

  hasTranslations(source: string): boolean {
    let hasTranslations = false;
    if (!!this.translations.find(translation => translation.machine === source.toLowerCase())) {
      hasTranslations = true;
    }
    return hasTranslations;
  }

  private setElementTranslationIds() {
    if (this.translations) {
      this.translations.map(translation => translation.elementId = translation._id);
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
    .saveThumb(up,  this.bookId, translation.userId, translation.translationId, translation.elementId)
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
    if (this.translations && this.translations.length) {
      // initial translations from @input
      this.translations = this.processTranslations(this.translations);
    } else {
      // no initial translations, or from observable
      this.translationService
      .fetchSentenceTranslations(
        this.userLanCode,
        this.bookId,
        this.chapterSequence,
        sentence)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        translations => {
          this.translations = this.processTranslations(translations);
        }
      );
    }
  }

  private processTranslations(translations: SentenceTranslation[]): SentenceTranslation[] {
    if (translations.length) {
      this.sortTranslations(translations);
      this.checkUserHasTranslation(translations);
      this.getTranslationThumbs(translations[0].translationId);
      this.checkIfMachineTranslations(translations);
      translations = this.removeDuplicateTranslations(translations);
    } else {
      this.isLoading = false;
    }
    return translations;
  }

  private removeDuplicateTranslations(translations: SentenceTranslation[]): SentenceTranslation[] {
    return translations.filter(translation => !translation.isDuplicate);
  }

  private sortTranslations(translations: SentenceTranslation[]) {
    translations.sort((a, b) => a.score > b.score ? -1 : (b.score > a.score ? 1 : 0));
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
        this.isLoading = false;
      }
    );
  }

  private addUpdateTranslation(translation: string, translationnote: string) {
    this.submitting = true;
    this.duplicate = false;
    translation = translation.trim();
    translationnote = translationnote || '';
    translationnote = translationnote.trim();
    const duplicate = this.translations.find(t => t.translation === translation && t.note === translationnote);
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
    this.translationService
    .addSentenceTranslation(
      this.bookLanCode,
      this.userLanCode,
      this.bookId,
      this.chapterSequence,
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
    newTranslation.translationId = newTranslationData.translationsId;
    this.translations.unshift(newTranslation);
    return newTranslation;
  }

  private updateTranslation(translation: string, note: string) {
    this.translationService
    .updateSentenceTranslation(
      this.translations[this.isEditing].translationId,
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
    return Math.round(points * 3);
  }

  private checkIfMachineTranslations(translations: SentenceTranslation[]) {
    // Check if there is a machine translation
    // User can only add a machine translation if it isn't available yet
    this.hasDeeplTranslations = !!translations.find(t => t.isMachine && t.machine === 'deepl');
    this.hasMSTranslations = !!translations.find(t => t.isMachine && t.machine === 'microsoft');
  }

  private checkMachineTranslationAvailability() {
    // Check if both source and target languages are available in deepl
    const deeplLanguages = this.translationService.getMachineLanguages('deepl');
    if (deeplLanguages.includes(this.userLanCode) && deeplLanguages.includes(this.bookLanCode)) {
      this.isDeeplAvailable = true;
    }
  }

  private checkUserHasTranslation(translations: SentenceTranslation[]) {
    // Check if the current user has already submitted a translation
    const userTranslation = translations.find(translation =>
      !translation.isMachine && translation.lanCode === this.userLanCode && translation.userId.toString() === this.userId.toString());
    if (userTranslation) {
      this.submitted = true;
      if (this.isRevision) {
        this.canEdit = false;
      }
    }
  }

  private observe() {
    this.answersReceived
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(answers => {
      this.canThumb = false;
      this.canEdit = false;
      this.canConfirm = false;
      if (answers && answers.answers) {
        const lastAnswer = answers.answers.slice(-1);
        if (lastAnswer === 'y' || lastAnswer === 'm') {
          this.canThumb = true;
          if (lastAnswer !== 'm') {
            this.canEdit = true;
          } else {
            this.canConfirm = true;
            if (this.translations && this.translations.length) {
              this.confirm.emit(); // Can modify answer if maybe was answered initially
            }
          }
        }
        this.showTranslations = true;
      }
    });
    if (this.newSentence) {
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
          this.canConfirm = false;
          this.hasDeeplTranslations = false;
          this.hasMSTranslations = false;
          this.translations = [];
          this.isLoading = true;
          this.getSentenceTranslations(sentence);
        }
      });
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
