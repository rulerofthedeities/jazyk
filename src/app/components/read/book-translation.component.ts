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

  onAddTranslation(translation: string) {
    this.submitting = true;
    this.duplicate = false;
    translation = translation.trim();
    const duplicate = this.translations.find(t => t.translation === translation);
    if (translation && !duplicate) {
      this.readService
      .addSentenceTranslation(this.interfaceLan, this.bookId, this.sentence, translation)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        result => {
          this.submitted = true;
          this.translations.unshift({translation, lanCode: this.interfaceLan, score: 0});
        }
      );
    } else if (duplicate) {
      this.submitting = false;
      this.duplicate = true;
    }
  }

  getColor(i: number): string {
    const lightness = Math.min(80, i * 10).toString();
    console.log('lightness', lightness);
    // return 'hsl(240, 100%, ' + lightness + '%)|sanitizeStyle';
    return 'hsl(200, 0%,' + lightness + '%)';
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
