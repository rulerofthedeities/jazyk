import { Component, Input, Output, OnDestroy, EventEmitter } from '@angular/core';
import { LanPair } from '../../models/main.model';
import { SentenceTranslation, TranslatedData } from '../../models/book.model';
import { ReadnListenService } from '../../services/readnlisten.service';
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
  @Output() translationAdded = new EventEmitter<TranslatedData>();
  private componentActive = true;
  isLoading = false;
  isTranslated = false;

  constructor(
    private readnListenService: ReadnListenService
  ) {}

  onGetMachineTranslation(tpe: string) {
    this.getMachineTranslation(tpe);
  }

  private getMachineTranslation(tpe: string) {
    this.isLoading = true;
    this.readnListenService
    .fetchMachineTranslation(tpe.toLowerCase(), this.lanPair, this.sentence)
    .pipe(takeWhile(() => this.componentActive), delay(1000))
    .subscribe(
      translation => {
        this.isTranslated = true;
        this.isLoading = false;
        console.log('machine translation', translation);
        this.saveTranslation(tpe.toLowerCase(), translation['translation'], 'Machine translation by ' + tpe);
      }
    );
  }

  private saveTranslation(tpe: string, translation: string, note: string) {
    this.readnListenService
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
        console.log('added translation', newTranslationData);
        this.translationAdded.emit(newTranslationData);
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
