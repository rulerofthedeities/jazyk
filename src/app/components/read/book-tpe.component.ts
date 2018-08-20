import { Component, Input } from '@angular/core';

@Component({
  selector: 'km-book-tpe',
  templateUrl: 'book-tpe.component.html'
})

export class BookTpeComponent {
  @Input() tpe: string;
  @Input() text: Object;
}
