import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { SentenceTranslation } from '../../models/book.model';
import { ReadService } from '../../services/read.service';
import { UserService } from '../../services/user.service';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-sentence-translations',
  templateUrl: 'book-translation.component.html',
  styleUrls: ['book-translation.component.css']
})

export class BookTranslationComponent implements OnInit, OnDestroy {
  @Input() translations: SentenceTranslation[] = [];
  @Input() answer: string;
  @Input() text: Object;
  @Input() bookId: string;
  @Input() sentence: string;
  private componentActive = true;
  interfaceLan = '';
  submitting = false;
  submitted = false;
  duplicate = false;

  constructor(
    private readService: ReadService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.interfaceLan = this.userService.user.main.lan;
  }

  onAddTranslation(translation: string, translationnote: string) {
    this.submitting = true;
    this.duplicate = false;
    translation = translation.trim();
    translationnote = translationnote.trim();
    const duplicate = this.translations.find(t => t.translation === translation);
    if (translation && !duplicate) {
      this.addTranslation(translation, translationnote);
    } else {
      this.submitting = false;
      if (duplicate) {
        this.duplicate = true;
      }
    }
  }

  getColor(i: number, isNote: boolean): string {
    const lightness = Math.min(80, (i + 1) * (isNote ? 50 : 10) - 10).toString();
    return 'hsl(200, 0%,' + lightness + '%)';
  }

  private addTranslation(translation: string, note: string) {
    this.readService
    .addSentenceTranslation(this.interfaceLan, this.bookId, this.sentence, translation, note)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        this.submitted = true;
        const newTranslation = {translation, note, lanCode: this.interfaceLan, score: 0};
        this.translations.unshift(newTranslation);

      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
