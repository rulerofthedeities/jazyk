import { Component, Input } from '@angular/core';
import { Book } from '../../models/book.model';

@Component({
  selector: 'km-book-tab',
  templateUrl: 'book-tab.component.html'
})

export class BookTabComponent {
  @Input() book: Book;
}
