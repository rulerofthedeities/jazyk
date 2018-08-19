import { Component, Input, OnInit } from '@angular/core';
import { Book } from '../../models/book.model';
import { ReadService } from '../../services/read.service';

@Component({
  selector: 'km-book-tab',
  templateUrl: 'book-tab.component.html',
  styleUrls: ['book-tab.component.css']
})

export class BookTabComponent implements OnInit {
  @Input() book: Book;
  @Input() weight: number;
  @Input() text: Object;
  difficultyPerc: number;

  constructor(
    private readService: ReadService
  ) {}

  ngOnInit() {
    this.difficultyPerc = this.readService.getBookDifficulty(this.book).difficultyPerc;
  }
}
