import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SessionData } from '../../models/book.model';

@Component({
  selector: 'km-sentences-results',
  templateUrl: 'book-results.component.html',
  styleUrls: ['book-results.component.css', 'book-bullets.component.css']
})

export class BookResultsComponent implements OnInit {
  @Input() data: SessionData;
  @Input() text: Object;
  percYes = 0;
  percMaybe = 0;
  percNo = 0;
  total = 0;
  showDetails = false;

  constructor(
    private router: Router
  ) {}

  ngOnInit() {
    console.log('session data', this.data);
    this.data = {
      answers: 'yynymyynym',
      nrYes: 6,
      nrNo: 3,
      nrMaybe: 2,
      chapters: 1,
      translations: 2
    };
    this.calculateResults();
  }

  onShowDetails(show: boolean) {
    this.showDetails = show;
  }

  onToRead() {
    this.router.navigate(['/read']);
  }

  private calculateResults() {
    this.total = this.data.nrYes + this.data.nrMaybe + this.data.nrNo;
    console.log(this.total);
    if (this.total > 0) {
      this.percYes = Math.round(this.data.nrYes / this.total * 1000) / 10;
      this.percMaybe = Math.round(this.data.nrMaybe / this.total * 1000) / 10;
      this.percNo = Math.round(this.data.nrNo / this.total * 1000) / 10;
    }
    console.log(this.percYes, this.percMaybe, this.percNo);
  }
}
