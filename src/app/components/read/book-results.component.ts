import { Component, Input, OnChanges } from '@angular/core';
import { SessionData } from '../../models/book.model';

@Component({
  selector: 'km-sentences-results',
  templateUrl: 'book-results.component.html',
  styleUrls: ['book-results.component.css', 'book-bullets.component.css']
})

export class BookResultsComponent implements OnChanges {
  @Input() data: SessionData;
  @Input() text: Object;
  percYes = 0;
  percMaybe = 0;
  percNo = 0;
  total = 0;
  showDetails = false;
  points = 0;

  ngOnChanges() {
    this.calculateResults();
  }

  onShowDetails(show: boolean) {
    this.showDetails = show;
  }

  private calculateResults() {
    this.total = this.data.nrYes + this.data.nrMaybe + this.data.nrNo;
    if (this.total > 0) {
      this.percYes = Math.round(this.data.nrYes / this.total * 1000) / 10;
      this.percMaybe = Math.round(this.data.nrMaybe / this.total * 1000) / 10;
      this.percNo = Math.round(this.data.nrNo / this.total * 1000) / 10;
    }
    this.points = this.data.points.finished + this.data.points.translations + this.data.points.words;
  }
}
