import { Component, Input } from '@angular/core';

@Component({
  selector: 'km-book-title',
  templateUrl: 'book-title.component.html',
  styleUrls: ['book-title.component.css']
})

export class BookTitleComponent {
  @Input() text: Object;
  @Input() bookType: string;
  @Input() isTest = false;
  @Input() bookLanCode: string;
  @Input() userLanCode: string;
  @Input() bookTitle: string;
  @Input() chapterTitle: string;

  constructor() { }


}
