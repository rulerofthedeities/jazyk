import { Component, Input, Output, OnDestroy, EventEmitter } from '@angular/core';
import { LanPair } from '../../models/main.model';
import { TranslatedData, SentenceTranslation } from '../../models/book.model';
import { TranslationService } from '../../services/translation.service';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-machine-translation',
  templateUrl: 'machine-translation.component.html',
  styleUrls: ['machine-translation.component.css']
})

export class MachineTranslationComponent implements OnDestroy {
  @Input() text: Object;
  @Input() source: string;
  @Input() bookId: string;
  @Input() chapterSequence: number;
  @Input() sentence: string;
  @Input() lanPair: LanPair;
  @Input() hasTranslations: boolean;
  @Input() canEdit: boolean;
  @Input() canThumb: boolean;
  @Output() translationAdded = new EventEmitter<TranslatedData>();
  @Input() translations: SentenceTranslation[] = []; // for duplicates
  private componentActive = true;
  isLoading = false;
  isTranslated = false;
  isError = false;
  errorMsg: string;
  errorDetail: string;

  constructor(
    private translationService: TranslationService
  ) {}

  onGetMachineTranslation() {
    this.getMachineTranslation();
  }

  private getMachineTranslation() {
    this.isLoading = true;
    this.translationService
    .fetchMachineTranslation(this.source.toLowerCase(), this.lanPair, this.sentence)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translation => {
        this.isLoading = false;
        if (translation) {
          this.isTranslated = true;
          const DeepLTranslations = translation.translations,
                MSTranslations = translation[0] ? translation[0].translations : [],
                tl = this.source === 'DeepL' ? DeepLTranslations : MSTranslations;
          if (tl[0] && tl[0].text) {
            this.saveTranslation(this.source.toLowerCase(), tl[0].text, 'Machine translation by ' + this.source);
          }
        }
      },
      error => {
        this.isLoading = false;
        this.isError = true;
        this.errorMsg = 'Error fetching machine translaton';
        this.errorDetail = JSON.stringify(error);
      }
    );
  }

  private saveTranslation(tpe: string, translation: string, note: string) {
    const duplicate = !!this.translations.find(t => t.translation === translation);
    this.translationService
    .addSentenceTranslation(
      this.lanPair.from,
      this.lanPair.to,
      this.bookId,
      this.chapterSequence,
      this.sentence,
      translation,
      note,
      true,
      tpe,
      duplicate)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (newTranslationData: TranslatedData) => {
        this.translationAdded.emit(newTranslationData);
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
