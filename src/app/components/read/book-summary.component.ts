import { Component, Input, OnInit } from '@angular/core';
import { Book } from '../../models/book.model';

@Component({
  selector: 'km-book-summary',
  templateUrl: 'book-summary.component.html',
  styleUrls: ['book-summary.component.css']
})

export class BookSummaryComponent implements OnInit {
  @Input() book: Book;
  @Input() text: Object;
  difficultyWidth: number;
  difficultyPerc: number;
  nrOfSentencesDone = 10;
  percDone: number;
  defaultImage = 'https://s3.eu-central-1.amazonaws.com/jazyk/books/blankbookcover.png';

  ngOnInit() {
    this.setDifficulty();
    this.percDone = Math.trunc(this.nrOfSentencesDone / this.book.difficulty.nrOfSentences * 100);
    console.log(this.percDone);
  }

  onStartReading() {
    console.log('Start reading', this.book);
  }

  onStopReading() {
    console.log('Stop reading', this.book);
  }

  private setDifficulty() {
    let difficulty = this.book.difficulty.weight;
    difficulty = difficulty - 250;
    difficulty = Math.max(50, difficulty);
    difficulty = difficulty * 1.34;
    difficulty = Math.min(1000, difficulty);
    this.difficultyWidth = Math.round(difficulty / 5);
    this.difficultyPerc = Math.round(difficulty / 10);
  }
}
