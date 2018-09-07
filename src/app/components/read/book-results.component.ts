import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { SessionData, ResultData, Trophy } from '../../models/book.model';
import { takeWhile } from 'rxjs/operators';
import { ReadService } from '../../services/read.service';

@Component({
  selector: 'km-sentences-results',
  templateUrl: 'book-results.component.html',
  styleUrls: ['book-results.component.css', 'book-bullets.component.css']
})

export class BookResultsComponent implements OnChanges, OnDestroy {
  @Input() data: SessionData;
  @Input() text: Object;
  private componentActive = true;
  percYes = 0;
  percMaybe = 0;
  percNo = 0;
  total = 0;
  showDetails = false;
  points = 0;
  isFinished = false;
  newTrophies: string[] = [];

  constructor(
    private readService: ReadService
  ) {}

  ngOnChanges() {
    this.calculateResults();
  }

  onShowDetails(show: boolean) {
    this.showDetails = show;
  }

  private calculateResults() {
    console.log('resultsdata', this.data);
    this.newTrophies = [];
    this.isFinished = this.data.resultData.isFinished;
    this.checkTrophies(this.data.resultData);
    this.total = this.data.nrYes + this.data.nrMaybe + this.data.nrNo;
    if (this.total > 0) {
      this.percYes = Math.round(this.data.nrYes / this.total * 1000) / 10;
      this.percMaybe = Math.round(this.data.nrMaybe / this.total * 1000) / 10;
      this.percNo = Math.round(this.data.nrNo / this.total * 1000) / 10;
    }
    this.points = this.data.points.finished + this.data.points.translations + this.data.points.words;
  }

  private checkTrophies(resultData: ResultData) {
    // First check if trophies were earned in this session
    const trophies: string[] = [];
    if (resultData.isFinished) {
      trophies.push('11');
      if (resultData.totalBookSentences >= 100) {
        trophies.push('12');
      }
      if (resultData.totalBookSentences >= 1000) {
        trophies.push('13');
      }
    }
    if (trophies.length) {
      // If there are any, check which trophies were earned before
      this.getTrophies(trophies);
    }
  }

  private getTrophies(trophiesThisSession: string[]) {
    this.readService
    .fetchTrophies()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (existingTrophies: Trophy[]) => {
        const newTrophies: string[] = [];
        console.log('saved trophies', existingTrophies);
        // The difference between existingTrophies and trophiesThisSession are new trophies
        let exists: Trophy;
        trophiesThisSession.forEach(trophy => {
          console.log(trophy, existingTrophies[0]);
          exists = existingTrophies.find(eTrophy => eTrophy.trophy === trophy);
          console.log('exists', exists);
          if (!exists) {
            newTrophies.push(trophy);
          }
        });
        // Save the new trophies and show them
        if (newTrophies.length) {
          this.saveTrophies(newTrophies);
        }
      }
    );
  }

  private saveTrophies(trophies: string[]) {
    console.log('trophies to save', trophies);
    this.readService
    .saveTrophies(trophies)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        this.newTrophies = trophies;
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
