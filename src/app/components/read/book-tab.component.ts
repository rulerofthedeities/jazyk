import { Component, Input, OnInit } from '@angular/core';
import { Book, UserBook } from '../../models/book.model';
import { ReadService } from '../../services/read.service';

@Component({
  selector: 'km-book-tab',
  templateUrl: 'book-tab.component.html',
  styleUrls: ['book-tab.component.css']
})

export class BookTabComponent implements OnInit {
  @Input() book: Book;
  @Input() private userBook: UserBook;
  @Input() weight: number;
  @Input() text: Object;
  difficultyPerc: number;
  isStarted: boolean;
  tooltip: string;

  constructor(
    private readService: ReadService
  ) {}

  ngOnInit() {
    this.isStarted = !!this.userBook && !!this.userBook.bookmark;
    this.difficultyPerc = this.readService.getBookDifficulty(this.book).difficultyPerc;
    this.tooltip = this.book.difficulty.weight > this.weight ? this.text['MoreDifficult'] : this.text['LessDifficult'];
  }

  onStartNewBook(book: Book) {
    this.readService.startNewBook(book);
  }
}
