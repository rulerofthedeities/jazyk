import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Book } from '../../models/book.model';
import { LicenseUrl } from '../../models/main.model';

@Component({
  selector: 'km-story-attribution',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'story-attribution.component.html',
  styleUrls: ['story-attribution.component.css']
})

export class StoryAttributionComponent {
  @Input() text: Object;
  @Input() book: Book;
  @Input() licenses: LicenseUrl[];
  showIntro = false;
  showCredits = false;

  onToggleIntro() {
    this.showIntro = !this.showIntro;
    if (this.showIntro) {
      this.showCredits = false;
    }
  }

  onToggleCredits() {
    this.showCredits = !this.showCredits;
    if (this.showCredits) {
      this.showIntro = false;
    }
  }
}
