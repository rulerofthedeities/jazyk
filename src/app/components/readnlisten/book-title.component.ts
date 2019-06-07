import { Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'km-book-title',
  templateUrl: 'book-title.component.html',
  styleUrls: ['book-title.component.css']
})

export class BookTitleComponent {
  @Input() text: Object;
  @Input() bookType: string;
  @Input() isTest = false;
  @Input() canClose = false;
  @Input() bookLanCode: string;
  @Input() userLanCode: string;
  @Input() bookTitle: string;
  @Input() chapterTitle: string;
  @Output() close = new EventEmitter<boolean>();

  constructor() { }

  onExit() {
    console.log('closing title');
    this.close.emit(true);
  }

  getToolTip(): string {
    switch (this.bookType) {
      case 'listen': return this.text['ListeningSession'];
      case 'wordlist': return this.text['WordList'];
      case 'revision': return this.text['Revision'];
      case 'flashcards': return this.text['Flashcards'];
      default: return this.text['ReadingSession'];
    }
  }
}
