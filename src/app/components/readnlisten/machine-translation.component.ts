import { Component, Input, Output, OnDestroy, EventEmitter } from '@angular/core';
import { LanPair } from '../../models/main.model';
import { DeepLTranslations, TranslatedData } from '../../models/book.model';
import { TranslationService } from '../../services/translation.service';
import { takeWhile, delay } from 'rxjs/operators';

@Component({
  selector: 'km-machine-translation',
  templateUrl: 'machine-translation.component.html',
  styleUrls: ['machine-translation.component.css']
})

export class MachineTranslationComponent implements OnDestroy {
  @Input() text: Object;
  @Input() bookId: string;
  @Input() sentence: string;
  @Input() lanPair: LanPair;
  @Input() hasTranslations: boolean;
  @Input() canEdit: boolean;
  @Input() canThumb: boolean;
  @Output() translationAdded = new EventEmitter<TranslatedData>();
  private componentActive = true;
  isLoading = false;
  isTranslated = false;
  isError = false;
  errorMsg: string;
  errorDetail: string;

  constructor(
    private translationService: TranslationService
  ) {}

  onGetMachineTranslation(tpe: string) {
    this.getMachineTranslation(tpe);
  }

  private getMachineTranslation(tpe: string) {
    this.isLoading = true;
    this.translationService
    .fetchMachineTranslation(tpe.toLowerCase(), this.lanPair, this.sentence)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (translation: DeepLTranslations) => {
        this.isLoading = false;
        if (translation) {
          this.isTranslated = true;
          const translations = translation.translations;
          if (translations[0] && translations[0].text) {
            this.saveTranslation(tpe.toLowerCase(), translations[0].text, 'Machine translation by ' + tpe);
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
    this.translationService
    .addSentenceTranslation(
      this.lanPair.from,
      this.lanPair.to,
      this.bookId,
      this.sentence,
      translation,
      note,
      true,
      tpe)
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
