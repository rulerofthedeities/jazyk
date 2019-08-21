import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'km-book-tpe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'book-tpe.component.html'
})

export class BookTpeComponent {
  @Input() tpe: string;
  @Input() text: Object;
}
