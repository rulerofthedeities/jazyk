import { Component, Input, OnInit } from '@angular/core';
import { Book, UserBook } from '../../models/book.model';
import { SharedService } from '../../services/shared.service';
import { ReadnListenService } from '../../services/readnlisten.service';

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
  bookType: string;
  isTest: boolean;

  constructor(
    private readnListenService: ReadnListenService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.bookType = this.userBook.bookType;
    this.isTest = this.userBook.isTest;
    this.isStarted = !!this.userBook && !!this.userBook.bookmark;
    this.difficultyPerc = this.sharedService.getBookDifficulty(this.book).difficultyPerc;
    this.tooltip = this.book.difficulty.weight > this.weight ? this.text['MoreDifficult'] : this.text['LessDifficult'];
  }

  onStartNewBook(book: Book) {
    this.readnListenService.startNewBook(book);
  }
}
