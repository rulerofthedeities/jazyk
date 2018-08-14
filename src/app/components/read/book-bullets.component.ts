import { Component, Input } from '@angular/core';
import { SessionData } from '../../models/book.model';

@Component({
  selector: 'km-book-bullets',
  templateUrl: 'book-bullets.component.html',
  styleUrls: ['book-bullets.component.css']
})

export class BookBulletsComponent {
  @Input() data: SessionData;
}
